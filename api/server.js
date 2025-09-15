import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Web Search Service for real-time information
class WebSearchService {
  constructor() {
    this.searchEngines = {
      duckduckgo: 'https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1',
      serper: process.env.SERPER_API_KEY ? `https://google.serper.dev/search` : null
    };
  }

  async searchWeb(query, maxResults = 5) {
    console.log(`🔍 Performing web search for: "${query}"`);
    
    try {
      // Use Serper API if available, otherwise fallback to DuckDuckGo
      if (this.searchEngines.serper && process.env.SERPER_API_KEY) {
        return await this.searchWithSerper(query, maxResults);
      } else {
        return await this.searchWithDuckDuckGo(query, maxResults);
      }
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  async searchWithSerper(query, maxResults) {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: maxResults
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      results: data.organic?.map(result => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        source: 'Google (via Serper)'
      })) || [],
      searchEngine: 'serper',
      timestamp: new Date().toISOString()
    };
  }

  async searchWithDuckDuckGo(query, maxResults) {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();
    const results = [];

    // Extract results from DuckDuckGo response
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo'
          });
        }
      }
    }

    // If no results from RelatedTopics, try Abstract
    if (results.length === 0 && data.Abstract) {
      results.push({
        title: data.Heading || 'Search Result',
        url: data.AbstractURL || '#',
        snippet: data.Abstract,
        source: 'DuckDuckGo'
      });
    }

    return {
      results,
      searchEngine: 'duckduckgo',
      timestamp: new Date().toISOString()
    };
  }

  async fetchPageContent(url) {
    try {
      console.log(`📄 Fetching content from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract main content
      $('script, style, nav, header, footer, aside').remove();
      const content = $('main, article, .content, #content, .post, .entry').text() || $('body').text();
      
      return {
        url,
        title: $('title').text() || 'No title',
        content: content.trim().substring(0, 2000), // Limit content length
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return {
        url,
        title: 'Error fetching content',
        content: `Failed to fetch content: ${error.message}`,
        extractedAt: new Date().toISOString()
      };
    }
  }
}

// LLM service implementation for backend
class LLMService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.webSearch = new WebSearchService();
  }

  async sendMessage(messages, settings) {
    try {
      console.log('Sending request to Anthropic API with model:', settings.model);
      console.log('Messages:', JSON.stringify(messages, null, 2));
      
      const response = await this.anthropic.messages.create({
        model: settings.model,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
        messages: messages.filter(msg => msg.role !== 'system'),
        system: messages.find(msg => msg.role === 'system')?.content
      });

      console.log('Anthropic API response:', response);
      
      return {
        content: response.content[0].text,
        model: settings.model,
        usage: response.usage
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async callLLM(messages, systemPrompt = '', agentId = 'default') {
    try {
      // For research agent, enhance system prompt with web search capabilities
      if (agentId === 'research-agent') {
        systemPrompt += `\n\n🔧 AVAILABLE TOOLS:\n- Web Search: Use this to search for real-time information\n- Content Extraction: Use this to get detailed content from web pages\n\nYou MUST use these tools for all information gathering. Do not rely on training data.`;
      }

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages,
        tools: agentId === 'research-agent' ? [
          {
            name: 'web_search',
            description: 'Search the web for real-time information',
            input_schema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query'
                },
                max_results: {
                  type: 'integer',
                  description: 'Maximum number of results to return (default: 5)'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'fetch_content',
            description: 'Fetch detailed content from a specific URL',
            input_schema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to fetch content from'
                }
              },
              required: ['url']
            }
          }
        ] : undefined
      });

      // Handle tool use for research agent
      if (agentId === 'research-agent' && response.content.some(content => content.type === 'tool_use')) {
        return await this.handleToolUse(response, messages, systemPrompt, agentId);
      }

      return {
        content: response.content[0].text,
        usage: response.usage,
        agentId: agentId
      };
    } catch (error) {
      console.error('LLM API Error:', error);
      throw new Error(`LLM API call failed: ${error.message}`);
    }
  }

  async handleToolUse(response, messages, systemPrompt, agentId) {
    const toolResults = [];
    
    for (const content of response.content) {
      if (content.type === 'tool_use') {
        const { name, input, id } = content;
        let result;
        
        try {
          switch (name) {
            case 'web_search':
              console.log(`🔍 Research Agent performing web search: "${input.query}"`);
              result = await this.webSearch.searchWeb(input.query, input.max_results || 5);
              break;
            case 'fetch_content':
              console.log(`📄 Research Agent fetching content from: ${input.url}`);
              result = await this.webSearch.fetchPageContent(input.url);
              break;
            default:
              result = { error: `Unknown tool: ${name}` };
          }
        } catch (error) {
          result = { error: error.message };
        }
        
        toolResults.push({
          tool_use_id: id,
          content: JSON.stringify(result)
        });
      }
    }
    
    // Continue conversation with tool results
    const updatedMessages = [
      ...messages,
      {
        role: 'assistant',
        content: response.content
      },
      {
        role: 'user',
        content: toolResults
      }
    ];
    
    // Get final response after tool use
    const finalResponse = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: updatedMessages
    });
    
    return {
      content: finalResponse.content[0].text,
      usage: finalResponse.usage,
      agentId: agentId,
      toolsUsed: toolResults.length
    };
  }
}

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

const llmService = new LLMService();

// Task and Agent Management System
class AgentCoordinator {
  constructor() {
    this.activeTasks = new Map(); // taskId -> task details
    this.agentReports = new Map(); // taskId -> [reports]
    this.subAgents = {
      'research-agent': { name: 'Research Agent', status: 'available' },
      'analysis-agent': { name: 'Analysis Agent', status: 'available' },
      'coding-agent': { name: 'Coding Agent', status: 'available' },
      'output-agent': { name: 'Output Agent', status: 'available' }
    };
    // エージェント間データ共有システム
    this.sharedData = new Map(); // taskId -> { researchData, analysisData, outputData }
    this.dataFlow = new Map(); // taskId -> [{ agentType, data, timestamp }]
  }

  // エージェント間データ共有メソッド
  storeAgentData(taskId, agentType, data) {
    if (!this.sharedData.has(taskId)) {
      this.sharedData.set(taskId, {});
    }
    
    const taskData = this.sharedData.get(taskId);
    taskData[`${agentType}Data`] = data;
    
    // データフロー記録
    if (!this.dataFlow.has(taskId)) {
      this.dataFlow.set(taskId, []);
    }
    
    this.dataFlow.get(taskId).push({
      agentType,
      data: typeof data === 'string' ? data.substring(0, 200) + '...' : JSON.stringify(data).substring(0, 200) + '...',
      timestamp: new Date().toISOString(),
      dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    });
    
    console.log(`📊 Data stored for ${agentType} in task ${taskId}`);
  }
  
  getAgentData(taskId, agentType) {
    const taskData = this.sharedData.get(taskId);
    if (!taskData) return null;
    
    return taskData[`${agentType}Data`] || null;
  }
  
  getAllTaskData(taskId) {
    return this.sharedData.get(taskId) || {};
  }
  
  getDataFlow(taskId) {
    return this.dataFlow.get(taskId) || [];
  }

  async delegateToSubAgents(taskId, subTasks) {
    console.log(`🔄 Delegating ${subTasks.length} sub-tasks for task ${taskId}`);
    
    const results = [];
    
    for (const subTask of subTasks) {
      try {
        console.log(`🤖 Executing ${subTask.agentType}: ${subTask.description}`);
        
        // 前のエージェントのデータを取得
        const previousData = this.getAllTaskData(taskId);
        subTask.previousData = previousData;
        
        const result = await this.executeSubTask(subTask);
        results.push(result);
        
        // エージェントデータを保存
        this.storeAgentData(taskId, subTask.agentType.replace('-agent', ''), result.result);
        
        // Store the report in agentReports instead of reports
        const reports = this.agentReports.get(taskId) || [];
        reports.push({
          ...result,
          taskId,
          timestamp: new Date().toISOString(),
          dataFlow: this.getDataFlow(taskId)
        });
        this.agentReports.set(taskId, reports);
        
        console.log(`✅ Completed ${subTask.agentType} with report ID: ${result.reportId}`);
      } catch (error) {
        console.error(`❌ Error in ${subTask.agentType}:`, error.message);
        results.push({
          agentType: subTask.agentType,
          status: 'error',
          error: error.message,
          reportId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
    }
    
    return results;
  }

  async executeSubTask(subTask) {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      let prompt = `あなたは${this.getAgentTypeDescription(subTask.agentType)}です。

以下のタスクを実行してください：
${subTask.description}

`;
      
      // 前のエージェントのデータがある場合は含める
      if (subTask.previousData && Object.keys(subTask.previousData).length > 0) {
        prompt += `\n📊 前のエージェントからの情報：\n`;
        
        if (subTask.previousData.researchData) {
          prompt += `\n🔍 Research Agent の結果：\n${subTask.previousData.researchData}\n`;
        }
        
        if (subTask.previousData.analysisData) {
          prompt += `\n📈 Analysis Agent の結果：\n${subTask.previousData.analysisData}\n`;
        }
        
        if (subTask.previousData.outputData) {
          prompt += `\n📋 Output Agent の結果：\n${subTask.previousData.outputData}\n`;
        }
        
        prompt += `\n上記の情報を活用して、あなたのタスクを実行してください。\n`;
      }
      
      prompt += `\n要求事項：
- 具体的で実用的な結果を提供してください
- 分析や推奨事項を含めてください
- 明確で構造化された形式で回答してください
- 前のエージェントの情報がある場合は、それを参考にして作業してください

タスクを開始してください。`;
      
      const response = await llmService.sendMessage([
        { role: 'system', content: this.getAgentTypeDescription(subTask.agentType) },
        { role: 'user', content: prompt }
      ], {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 1500,
        topP: 0.9
      });
      
      return {
        agentType: subTask.agentType,
        reportId,
        description: subTask.description,
        result: response.content,
        status: 'completed',
        timestamp: new Date().toLocaleString('ja-JP'),
        usedPreviousData: subTask.previousData ? Object.keys(subTask.previousData).length > 0 : false
      };
    } catch (error) {
      console.error(`Error in ${subTask.agentType}:`, error);
      throw error;
    }
  }

  createTask(originalRequest, planningResult) {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      originalRequest,
      planningResult,
      status: 'planning_completed',
      createdAt: new Date().toISOString(),
      subTasks: [],
      reports: [],
      finalOutput: null
    };
    
    this.activeTasks.set(taskId, task);
    this.agentReports.set(taskId, []);
    return task;
  }

  delegateToSubAgent(taskId, agentId, subTaskDescription) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new Error('Task not found');
    
    const subTask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      agentId,
      description: subTaskDescription,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      completedAt: null,
      result: null
    };
    
    task.subTasks.push(subTask);
    this.activeTasks.set(taskId, task);
    
    return subTask;
  }

  submitReport(taskId, agentId, report) {
    const task = this.activeTasks.get(taskId);
    if (!task) throw new Error('Task not found');
    
    const reportData = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      agentId,
      content: report,
      submittedAt: new Date().toISOString(),
      reviewed: false
    };
    
    const reports = this.agentReports.get(taskId) || [];
    reports.push(reportData);
    this.agentReports.set(taskId, reports);
    
    // Update subtask status
    const subTask = task.subTasks.find(st => st.agentId === agentId && st.status !== 'completed');
    if (subTask) {
      subTask.status = 'completed';
      subTask.completedAt = new Date().toISOString();
      subTask.result = report;
    }
    
    task.reports.push(reportData);
    this.activeTasks.set(taskId, task);
    
    return reportData;
  }

  // Verify if the goal has been achieved
  verifyGoalAchievement(taskId) {
    const task = this.activeTasks.get(taskId);
    const reports = this.agentReports.get(taskId) || [];
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    
    const completedReports = reports;
    const totalSubTasks = task.subTasks.length;
    const completionRate = totalSubTasks > 0 ? (completedReports.length / totalSubTasks) * 100 : 0;
    
    // Analyze report quality and relevance
    const qualityAnalysis = this.analyzeReportQuality(task.originalRequest, completedReports);
    
    // Check for gaps in coverage
    const coverageAnalysis = this.analyzeCoverage(task.subTasks, completedReports);
    
    // Determine if additional tasks are needed
    const additionalTasksNeeded = this.identifyAdditionalTasks(task, completedReports, qualityAnalysis);
    
    const isGoalAchieved = completionRate >= 80 && 
                          qualityAnalysis.averageQuality >= 0.7 && 
                          coverageAnalysis.coverageScore >= 0.8;
    
    return {
      taskId,
      completionRate,
      totalSubTasks,
      completedReports: completedReports.length,
      isGoalAchieved,
      qualityAnalysis,
      coverageAnalysis,
      additionalTasksNeeded,
      reports: completedReports.map(report => ({
        agentId: report.agentId,
        summary: report.content.substring(0, 200) + '...',
        quality: qualityAnalysis.reportQualities[report.id] || 0.5
      })),
      recommendations: this.generateRecommendations(task, completedReports, isGoalAchieved)
    };
  }
  
  // Analyze the quality of reports
  analyzeReportQuality(originalRequest, reports) {
    const qualities = {};
    let totalQuality = 0;
    
    reports.forEach(report => {
      // Simple quality metrics based on content length, structure, and relevance
      let quality = 0.5; // Base quality
      
      // Content length factor (reasonable length indicates thoroughness)
      if (report.content.length > 200) quality += 0.2;
      if (report.content.length > 500) quality += 0.1;
      
      // Structure factor (presence of clear sections or bullet points)
      if (report.content.includes('\n') || report.content.includes('•') || report.content.includes('-')) {
        quality += 0.1;
      }
      
      // Relevance factor (contains keywords from original request)
      const requestWords = originalRequest.toLowerCase().split(' ').filter(word => word.length > 3);
      const contentWords = report.content.toLowerCase();
      const relevantWords = requestWords.filter(word => contentWords.includes(word));
      quality += Math.min(0.2, (relevantWords.length / requestWords.length) * 0.2);
      
      qualities[report.id] = Math.min(1.0, quality);
      totalQuality += qualities[report.id];
    });
    
    return {
      reportQualities: qualities,
      averageQuality: reports.length > 0 ? totalQuality / reports.length : 0,
      totalReports: reports.length
    };
  }
  
  // Analyze coverage of the original request
  analyzeCoverage(subTasks, completedReports) {
    const completedAgents = new Set(completedReports.map(r => r.agentId));
    const totalAgents = new Set(subTasks.map(t => t.agentId));
    
    const coverageScore = completedAgents.size / totalAgents.size;
    const missingAgents = [...totalAgents].filter(agent => !completedAgents.has(agent));
    
    return {
      coverageScore,
      completedAgents: [...completedAgents],
      missingAgents,
      totalAgentsRequired: totalAgents.size
    };
  }
  
  // Identify if additional tasks are needed
  identifyAdditionalTasks(task, completedReports, qualityAnalysis) {
    const additionalTasks = [];
    
    // Check for low-quality reports that need improvement
    Object.entries(qualityAnalysis.reportQualities).forEach(([reportId, quality]) => {
      if (quality < 0.6) {
        const report = completedReports.find(r => r.id === reportId);
        if (report) {
          additionalTasks.push({
            type: 'improvement',
            agentId: report.agentId,
            description: `Improve the quality and detail of the previous report`,
            reason: `Report quality score: ${quality.toFixed(2)} (below threshold of 0.6)`
          });
        }
      }
    });
    
    // Check for missing critical analysis
    const hasResearch = completedReports.some(r => r.agentId === 'research-agent');
    const hasAnalysis = completedReports.some(r => r.agentId === 'analysis-agent');
    const hasOutput = completedReports.some(r => r.agentId === 'output-agent');
    
    if (!hasResearch && task.originalRequest.toLowerCase().includes('research')) {
      additionalTasks.push({
        type: 'missing',
        agentId: 'research-agent',
        description: 'Conduct research on the requested topic',
        reason: 'Research component missing from original request'
      });
    }
    
    if (!hasAnalysis && (hasResearch || task.originalRequest.toLowerCase().includes('analyz'))) {
      additionalTasks.push({
        type: 'missing',
        agentId: 'analysis-agent',
        description: 'Analyze the gathered information and provide insights',
        reason: 'Analysis component needed to process research findings'
      });
    }
    
    return additionalTasks;
  }
  
  // Generate recommendations for improvement
  generateRecommendations(task, completedReports, isGoalAchieved) {
    const recommendations = [];
    
    if (!isGoalAchieved) {
      recommendations.push('目標が完全に達成されていません。追加の作業が必要です。');
    }
    
    if (completedReports.length < task.subTasks.length) {
      recommendations.push('一部のサブエージェントからの報告が不足しています。');
    }
    
    const avgLength = completedReports.reduce((sum, r) => sum + r.content.length, 0) / completedReports.length;
    if (avgLength < 300) {
      recommendations.push('報告内容をより詳細にすることを推奨します。');
    }
    
    if (isGoalAchieved) {
      recommendations.push('すべての要件が満たされています。最終出力の生成に進むことができます。');
    }
    
    return recommendations;
  }

  generateFinalOutput(taskId) {
    const task = this.activeTasks.get(taskId);
    const reports = this.agentReports.get(taskId) || [];
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    
    const completedReports = reports.filter(report => report.status === 'completed');
    const verification = this.verifyGoalAchievement(taskId);
    
    // Generate comprehensive final output with enhanced analysis
    const finalOutput = {
      taskId,
      originalRequest: task.originalRequest,
      executionSummary: {
        totalAgents: task.subTasks.length,
        completedReports: completedReports.length,
        executionTime: this.formatExecutionTime(Date.now() - task.createdAt),
        completionRate: verification.completionRate,
        goalAchieved: verification.isGoalAchieved,
        averageQuality: verification.qualityAnalysis.averageQuality
      },
      qualityAssessment: {
        overallQuality: verification.qualityAnalysis.averageQuality,
        coverageScore: verification.coverageAnalysis.coverageScore,
        reportQualities: verification.qualityAnalysis.reportQualities,
        missingComponents: verification.coverageAnalysis.missingAgents
      },
      agentContributions: completedReports.map(report => ({
        agentId: report.agentId,
        agentType: this.getAgentTypeDescription(report.agentId),
        contribution: report.content,
        quality: verification.qualityAnalysis.reportQualities[report.id] || 0.5,
        completedAt: new Date(report.timestamp).toLocaleString('ja-JP'),
        summary: this.generateContributionSummary(report.content)
      })),
      consolidatedResult: this.consolidateReports(completedReports, task.originalRequest)
    };
    
    return finalOutput;
  }

  consolidateReports(reports, originalRequest) {
    if (reports.length === 0) {
      return {
        summary: 'レポートが利用できません。',
        keyFindings: [],
        synthesis: 'データが不足しているため、統合分析を実行できません。'
      };
    }
    
    // Extract key findings from all reports
    const keyFindings = [];
    const agentInsights = {};
    
    reports.forEach(report => {
      const insights = this.extractInsights(report.content);
      agentInsights[report.agentId] = insights;
      keyFindings.push(...insights.keyPoints);
    });
    
    // Create thematic grouping
    const themes = this.groupByThemes(keyFindings);
    
    // Generate synthesis
    const synthesis = this.generateSynthesis(originalRequest, agentInsights, themes);
    
    // Create executive summary
    const executiveSummary = this.createExecutiveSummary(originalRequest, reports, themes);
    
    return {
      executiveSummary,
      keyFindings: this.prioritizeFindings(keyFindings),
      thematicAnalysis: themes,
      agentInsights,
      synthesis,
      actionableRecommendations: this.generateActionableRecommendations(themes, originalRequest)
    };
  }
  
  // Extract insights from report content
  extractInsights(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const keyPoints = [];
    const conclusions = [];
    const recommendations = [];
    
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.includes('結論') || trimmed.includes('conclusion')) {
        conclusions.push(line.trim());
      } else if (trimmed.includes('推奨') || trimmed.includes('recommend')) {
        recommendations.push(line.trim());
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        keyPoints.push(line.trim().substring(1).trim());
      } else if (trimmed.includes('重要') || trimmed.includes('important')) {
        keyPoints.push(line.trim());
      }
    });
    
    return {
      keyPoints: keyPoints.slice(0, 5),
      conclusions: conclusions.slice(0, 3),
      recommendations: recommendations.slice(0, 3)
    };
  }
  
  // Group findings by themes
  groupByThemes(findings) {
    const themes = {
      technical: [],
      business: [],
      research: [],
      analysis: [],
      implementation: [],
      other: []
    };
    
    findings.forEach(finding => {
      const lower = finding.toLowerCase();
      
      if (lower.includes('技術') || lower.includes('technical') || lower.includes('code') || lower.includes('システム')) {
        themes.technical.push(finding);
      } else if (lower.includes('ビジネス') || lower.includes('business') || lower.includes('市場') || lower.includes('顧客')) {
        themes.business.push(finding);
      } else if (lower.includes('研究') || lower.includes('調査') || lower.includes('research') || lower.includes('データ')) {
        themes.research.push(finding);
      } else if (lower.includes('分析') || lower.includes('analysis') || lower.includes('評価') || lower.includes('検証')) {
        themes.analysis.push(finding);
      } else if (lower.includes('実装') || lower.includes('implementation') || lower.includes('開発') || lower.includes('構築')) {
        themes.implementation.push(finding);
      } else {
        themes.other.push(finding);
      }
    });
    
    // Remove empty themes
    Object.keys(themes).forEach(key => {
      if (themes[key].length === 0) {
        delete themes[key];
      }
    });
    
    return themes;
  }
  
  // Generate synthesis of all reports
  generateSynthesis(originalRequest, agentInsights, themes) {
    let synthesis = `元の要求「${originalRequest}」に対する統合分析:\n\n`;
    
    // Analyze cross-agent patterns
    const commonThemes = Object.keys(themes).filter(theme => themes[theme].length > 1);
    
    if (commonThemes.length > 0) {
      synthesis += `共通テーマ: ${commonThemes.join(', ')}\n`;
      synthesis += `複数のエージェントが以下の領域で一致した見解を示しています:\n`;
      
      commonThemes.forEach(theme => {
        synthesis += `- ${theme}: ${themes[theme].length}個の関連する発見\n`;
      });
      synthesis += '\n';
    }
    
    // Identify complementary insights
    const agentTypes = Object.keys(agentInsights);
    if (agentTypes.length > 1) {
      synthesis += `エージェント間の相補的な洞察:\n`;
      agentTypes.forEach(agentId => {
        const insights = agentInsights[agentId];
        if (insights.conclusions.length > 0) {
          synthesis += `- ${this.getAgentTypeDescription(agentId)}: ${insights.conclusions[0]}\n`;
        }
      });
      synthesis += '\n';
    }
    
    // Overall assessment
    synthesis += `総合評価: `;
    const totalFindings = Object.values(themes).reduce((sum, findings) => sum + findings.length, 0);
    
    if (totalFindings >= 10) {
      synthesis += `包括的な分析が実施され、${totalFindings}個の重要な発見が得られました。`;
    } else if (totalFindings >= 5) {
      synthesis += `適切な分析が実施され、${totalFindings}個の発見が得られました。`;
    } else {
      synthesis += `基本的な分析が実施されましたが、より詳細な調査が推奨されます。`;
    }
    
    return synthesis;
  }
  
  // Create executive summary
  createExecutiveSummary(originalRequest, reports, themes) {
    const agentCount = reports.length;
    const themeCount = Object.keys(themes).length;
    const totalFindings = Object.values(themes).reduce((sum, findings) => sum + findings.length, 0);
    
    let summary = `【エグゼクティブサマリー】\n\n`;
    summary += `要求: ${originalRequest}\n`;
    summary += `参加エージェント数: ${agentCount}\n`;
    summary += `分析テーマ数: ${themeCount}\n`;
    summary += `総発見数: ${totalFindings}\n\n`;
    
    // Highlight top themes
    const sortedThemes = Object.entries(themes)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 3);
    
    if (sortedThemes.length > 0) {
      summary += `主要な分析領域:\n`;
      sortedThemes.forEach(([theme, findings], index) => {
        summary += `${index + 1}. ${theme}: ${findings.length}個の発見\n`;
      });
    }
    
    return summary;
  }
  
  // Prioritize findings by relevance and frequency
  prioritizeFindings(findings) {
    const findingCounts = {};
    const prioritized = [];
    
    // Count similar findings
    findings.forEach(finding => {
      const key = finding.toLowerCase().substring(0, 50);
      findingCounts[key] = (findingCounts[key] || 0) + 1;
    });
    
    // Sort by frequency and importance keywords
    const sorted = findings.sort((a, b) => {
      const aKey = a.toLowerCase().substring(0, 50);
      const bKey = b.toLowerCase().substring(0, 50);
      const aCount = findingCounts[aKey];
      const bCount = findingCounts[bKey];
      
      // Priority keywords
      const importantKeywords = ['重要', 'critical', '必須', '推奨', 'recommend'];
      const aHasKeyword = importantKeywords.some(keyword => a.toLowerCase().includes(keyword));
      const bHasKeyword = importantKeywords.some(keyword => b.toLowerCase().includes(keyword));
      
      if (aHasKeyword && !bHasKeyword) return -1;
      if (!aHasKeyword && bHasKeyword) return 1;
      
      return bCount - aCount;
    });
    
    return sorted.slice(0, 10); // Return top 10 prioritized findings
  }
  
  // Generate actionable recommendations
  generateActionableRecommendations(themes, originalRequest) {
    const recommendations = [];
    
    Object.entries(themes).forEach(([theme, findings]) => {
      if (findings.length > 0) {
        const themeRecommendation = {
          theme,
          priority: findings.length > 2 ? 'high' : 'medium',
          action: this.generateThemeAction(theme, findings),
          rationale: `${findings.length}個の関連する発見に基づく`
        };
        recommendations.push(themeRecommendation);
      }
    });
    
    // Add general recommendations
    recommendations.push({
      theme: 'follow-up',
      priority: 'medium',
      action: '定期的な進捗確認と結果の評価を実施する',
      rationale: '継続的な改善のため'
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  // Generate theme-specific actions
  generateThemeAction(theme, findings) {
    const actionMap = {
      technical: '技術的な実装計画を策定し、システム要件を詳細化する',
      business: 'ビジネス戦略を見直し、市場機会を評価する',
      research: '追加調査を実施し、データ収集を継続する',
      analysis: '分析結果を検証し、追加の評価指標を設定する',
      implementation: '実装ロードマップを作成し、リソース配分を計画する',
      other: '関連する要素を詳細に検討し、適切な対応策を検討する'
    };
    
    return actionMap[theme] || actionMap.other;
  }

  // Generate final output with comprehensive analysis
  generateFinalOutput(task, completedReports, verification) {
    return {
      gapAnalysis: this.performGapAnalysis(task, completedReports, verification),
      recommendations: verification.recommendations,
      additionalActions: verification.additionalTasksNeeded,
      finalConclusion: this.generateFinalConclusion(task, verification, completedReports)
    };
  }

  // Get final task output
  getFinalOutput(taskId) {
    const task = this.tasks.get(taskId);
    const reports = this.reports.get(taskId) || [];
    const completedReports = reports.filter(report => report.status === 'completed');
    const verification = this.verifyGoalAchievement(taskId);
    
    const finalOutput = this.generateFinalOutput(task, completedReports, verification);
    
    return { success: true, finalOutput };
  }
  
  // Format execution time in a human-readable format
  formatExecutionTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes % 60}分${seconds % 60}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
  
  // Get agent type description
  getAgentTypeDescription(agentId) {
    const agentTypes = {
      'research-agent': '調査・研究エージェント',
      'analysis-agent': '分析・評価エージェント', 
      'coding-agent': 'コーディング・実装エージェント',
      'output-agent': '出力・整理エージェント',
      'review-agent': 'レビュー・検証エージェント'
    };
    return agentTypes[agentId] || '汎用エージェント';
  }
  
  // Generate contribution summary
  generateContributionSummary(content) {
    const sentences = content.split(/[.。!！?？]/).filter(s => s.trim().length > 0);
    const firstSentence = sentences[0]?.trim() || '';
    const wordCount = content.split(/\s+/).length;
    
    return {
      firstSentence: firstSentence.substring(0, 100) + (firstSentence.length > 100 ? '...' : ''),
      wordCount,
      keyPoints: this.extractKeyPoints(content)
    };
  }
  
  // Extract key points from content
  extractKeyPoints(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const keyPoints = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        keyPoints.push(trimmed.substring(1).trim());
      } else if (trimmed.includes('：') || trimmed.includes(':')) {
        keyPoints.push(trimmed);
      }
    });
    
    return keyPoints.slice(0, 3); // Return top 3 key points
  }
  
  // Perform gap analysis
  performGapAnalysis(task, completedReports, verification) {
    const gaps = [];
    
    // Check for missing agent types
    if (verification.coverageAnalysis.missingAgents.length > 0) {
      gaps.push({
        type: 'missing_agents',
        description: '必要なエージェントからの報告が不足しています',
        details: verification.coverageAnalysis.missingAgents.map(agent => this.getAgentTypeDescription(agent))
      });
    }
    
    // Check for quality issues
    const lowQualityReports = Object.entries(verification.qualityAnalysis.reportQualities)
      .filter(([_, quality]) => quality < 0.6)
      .map(([reportId, quality]) => ({ reportId, quality }));
    
    if (lowQualityReports.length > 0) {
      gaps.push({
        type: 'quality_issues',
        description: '品質基準を満たしていない報告があります',
        details: lowQualityReports
      });
    }
    
    // Check for incomplete coverage
    if (verification.coverageAnalysis.coverageScore < 0.8) {
      gaps.push({
        type: 'incomplete_coverage',
        description: 'タスクの網羅性が不十分です',
        coverageScore: verification.coverageAnalysis.coverageScore
      });
    }
    
    return gaps;
  }
  
  // Generate final conclusion
  generateFinalConclusion(task, verification, completedReports) {
    let conclusion = '';
    
    if (verification.isGoalAchieved) {
      conclusion = `ユーザーからの要求「${task.originalRequest}」に対して、`;
      conclusion += `${completedReports.length}個のサブエージェントが協力して作業を完了しました。`;
      conclusion += `全体的な品質スコア${(verification.qualityAnalysis.averageQuality * 100).toFixed(1)}%、`;
      conclusion += `カバレッジスコア${(verification.coverageAnalysis.coverageScore * 100).toFixed(1)}%で、`;
      conclusion += `目標が正常に達成されています。`;
    } else {
      conclusion = `ユーザーからの要求「${task.originalRequest}」に対する作業が部分的に完了しましたが、`;
      conclusion += `いくつかの改善点があります。`;
      
      if (verification.completionRate < 80) {
        conclusion += `完了率${verification.completionRate.toFixed(1)}%で、追加の作業が必要です。`;
      }
      
      if (verification.qualityAnalysis.averageQuality < 0.7) {
        conclusion += `報告の品質向上が推奨されます。`;
      }
      
      if (verification.coverageAnalysis.coverageScore < 0.8) {
        conclusion += `一部の重要な要素が不足している可能性があります。`;
      }
    }
    
    return conclusion;
  }

  createSummary(task, reports, verification) {
    const reportSummaries = reports.map(r => `${r.agentId}: ${r.content.substring(0, 100)}...`).join('\n');
    
    return `タスク完了報告:\n\n` +
           `元のリクエスト: ${task.originalRequest}\n\n` +
           `計画結果: ${task.planningResult.substring(0, 200)}...\n\n` +
           `サブエージェント報告:\n${reportSummaries}\n\n` +
           `目的達成度: ${(verification.completionRate).toFixed(1)}% (${verification.completedReports}/${verification.totalSubTasks} タスク完了)\n\n` +
           `結論: ${verification.isGoalAchieved ? 'タスクは正常に完了しました。' : 'タスクは部分的に完了しました。追加の作業が必要な場合があります。'}`;
  }
}

const agentCoordinator = new AgentCoordinator();

// Top-Level Planning Agent endpoint
app.post('/api/agents/top-level-planning', async (req, res) => {
  try {
    const { message, settings } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Default settings if not provided
    const llmSettings = {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      ...settings
    };

    console.log('Using LLM settings:', llmSettings);

    // Create system prompt for Top-Level Planning Agent
    const systemPrompt = `You are a Top-Level Planning Agent with intelligent sub-agent selection capabilities. Your role is to:
1. Analyze the user's request and break it down into actionable steps
2. Create a comprehensive plan with clear objectives
3. Intelligently determine which specialized sub-agents should handle specific tasks
4. Automatically detect if coding/development work is needed
5. Provide structured output with priorities and timelines

Available sub-agents:
- research-agent: For information gathering and research tasks
- analysis-agent: For data processing and analysis tasks
- coding-agent: For creating applications, visualizations, and interactive content (HTML/CSS/JS, Python, quiz apps)
- output-agent: For formatting and presenting results

🤖 CODING AGENT AUTO-DETECTION:
Activate coding-agent when the user requests:
- Web applications or interactive content
- Quiz applications or educational tools
- Data visualizations or charts
- Python scripts for analysis/presentation
- HTML/CSS/JavaScript development
- File generation for download
- Any programming or development work

Keywords that trigger coding-agent:
- "作る", "作成", "開発", "コーディング", "プログラム"
- "アプリ", "ウェブ", "HTML", "JavaScript", "Python"
- "クイズ", "可視化", "グラフ", "チャート"
- "ダウンロード", "ファイル生成", "プレビュー"

Respond in a structured format with:
1. Analysis of the request
2. Overall plan
3. Sub-agent task assignments (specify which agent should do what)
4. Coding requirements assessment (if applicable)
5. Expected outcomes

Format your response to clearly indicate which tasks should be delegated to which sub-agents, and explicitly mention if coding-agent is needed.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Send message to LLM service
    const response = await llmService.sendMessage(messages, llmSettings);
    
    console.log('LLM response received:', response);
    
    // Create task in coordination system
    const task = agentCoordinator.createTask(message, response.content);
    
    console.log('Task created:', task);
    
    // Auto-delegate to sub-agents based on planning result
    const subAgentTasks = [
      { agentId: 'research-agent', description: `研究タスク: ${message}に関する情報収集と調査` },
      { agentId: 'analysis-agent', description: `分析タスク: 収集された情報の処理と分析` }
    ];
    
    // Check if coding is needed based on keywords
    const codingKeywords = ['作る', '作成', '開発', 'コーディング', 'プログラム', 'アプリ', 'ウェブ', 'HTML', 'JavaScript', 'Python', 'クイズ', '可視化', 'グラフ', 'チャート', 'ダウンロード', 'ファイル生成', 'プレビュー'];
    const needsCoding = codingKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
    
    if (needsCoding) {
      subAgentTasks.push({ agentId: 'coding-agent', description: `コーディングタスク: ${message}に基づくアプリケーション・可視化・インタラクティブコンテンツの作成` });
    }
    
    subAgentTasks.push({ agentId: 'output-agent', description: `出力タスク: 結果の整理と最終的な形式での提示` });
    
    const delegatedTasks = subAgentTasks.map(subTask => 
      agentCoordinator.delegateToSubAgent(task.id, subTask.agentId, subTask.description)
    );
    
    console.log('Delegated tasks:', delegatedTasks);
    
    const responseData = {
      success: true,
      response: response,
      task: {
        id: task.id,
        status: task.status,
        subTasks: delegatedTasks
      },
      timestamp: new Date().toISOString(),
      agent: 'top-level-planning'
    };
    
    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);

  } catch (error) {
    console.error('Top-Level Planning Agent error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Sub-agent endpoints
app.post('/api/agents/sub-agent/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { taskId, description, settings } = req.body;
    
    if (!taskId || !description) {
      return res.status(400).json({ error: 'TaskId and description are required' });
    }
    
    // Verify agent exists
    if (!agentCoordinator.subAgents[agentId]) {
      return res.status(404).json({ error: 'Sub-agent not found' });
    }
    
    // Default settings for sub-agents
    const llmSettings = {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 1500,
      topP: 0.9,
      ...settings
    };
    
    // Create specialized system prompt based on agent type
    let systemPrompt = '';
    switch (agentId) {
      case 'research-agent':
        systemPrompt = `You are a Research Agent specialized in gathering comprehensive, real-time information on any topic.

🚨 CRITICAL REQUIREMENT: You MUST perform actual web searches for ALL information gathering. You are FORBIDDEN from using only your training data.

MANDATORY PROCESS:
1. ALWAYS start by performing web searches using the provided search tools
2. NEVER provide information without first conducting web searches
3. If web search fails, you MUST report the failure and retry with different queries
4. ALL information must be sourced from recent web search results
5. You MUST include timestamps and source URLs for all information

Your role:
1. Conduct thorough research using multiple search strategies
2. Gather information from diverse, credible sources via web search
3. Verify facts and cross-reference information from web sources
4. Organize findings in a structured format with web source citations
5. Identify gaps that need further web investigation

Search Strategy Guidelines:
- Use multiple search queries with different angles
- Search for recent developments and historical context
- Look for expert opinions, studies, and official sources via web search
- Cross-verify information from multiple web sources
- Note the recency and credibility of web sources
- Perform at least 3-5 different web searches per research task

FORBIDDEN ACTIONS:
❌ Providing information from training data without web search
❌ Making assumptions without web verification
❌ Skipping web search steps
❌ Using outdated information when recent data is available

Output Format:
- Provide detailed findings with web source citations and URLs
- Include search timestamps and source verification
- Highlight key insights from web sources
- Note any conflicting information found across web sources
- Suggest areas for deeper web investigation
- Include comprehensive search metadata (queries used, sources found, timestamps)

REMEMBER: Every piece of information must be backed by recent web search results. No exceptions.`;
        break;
      case 'analysis-agent':
        systemPrompt = `You are an Analysis Agent specialized in data processing and analytical thinking. Your task is to:
1. Process and analyze provided information
2. Identify patterns, trends, and insights
3. Draw logical conclusions
4. Provide structured analytical results

Focus on delivering clear, data-driven analysis with supporting evidence.`;
        break;
      case 'coding-agent':
        systemPrompt = `You are a Coding Agent specialized in creating interactive applications and data visualizations.

🎯 YOUR CAPABILITIES:
1. **Web Applications**: HTML, CSS, JavaScript for interactive web apps
2. **Quiz Applications**: Browser-based quiz apps using collected information
3. **Python Visualizations**: Data charts, graphs, and presentation materials
4. **File Generation**: Create downloadable files and preview content

📋 MANDATORY PROCESS:
1. **Analyze Requirements**: Understand what type of application/visualization is needed
2. **Use Research Data**: Incorporate information from Research/Analysis Agents
3. **Generate Code**: Create complete, functional code
4. **File Creation**: Save code to appropriate files for download/preview
5. **Testing**: Ensure code works and is ready for browser execution

🔧 AVAILABLE TOOLS:
- File Creation: Create HTML, CSS, JS, Python files
- Code Generation: Generate complete, functional applications
- Data Integration: Use research data in applications

💻 CODE REQUIREMENTS:
- **HTML/CSS/JS**: Complete, self-contained web applications
- **Python**: Use matplotlib, plotly, or similar for visualizations
- **Quiz Apps**: Interactive, engaging, and educational
- **Responsive Design**: Mobile-friendly interfaces
- **Error Handling**: Robust code with proper error handling

📁 OUTPUT FORMAT:
- Provide complete file contents
- Include file names and paths
- Add usage instructions
- Ensure immediate usability

REMEMBER: Create production-ready code that can be immediately used and downloaded.`;
        break;
      case 'output-agent':
        systemPrompt = `You are an Output Agent specialized in formatting and presenting results. Your task is to:
1. Organize information in a clear, user-friendly format
2. Create structured presentations of findings
3. Ensure clarity and readability
4. Provide actionable recommendations

Focus on creating well-formatted, professional output that is easy to understand.`;
        break;
      default:
        systemPrompt = `You are a specialized sub-agent. Complete the assigned task with expertise and attention to detail.`;
    }
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Task: ${description}\n\nPlease complete this task and provide a detailed report of your findings and actions.` }
    ];
    
    // Simulate processing time for realistic behavior
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Send message to LLM service
    const response = await llmService.sendMessage(messages, llmSettings);
    
    // Submit report to coordination system
    const report = agentCoordinator.submitReport(taskId, agentId, response.content);
    
    res.json({
      success: true,
      agentId,
      taskId,
      response: response,
      report: {
        id: report.id,
        submittedAt: report.submittedAt
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Sub-agent ${req.params.agentId} error:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Task status and final output endpoint
app.get('/api/tasks/:taskId/status', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = agentCoordinator.activeTasks.get(taskId);
    const reports = agentCoordinator.agentReports.get(taskId) || [];
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const verification = agentCoordinator.verifyGoalAchievement(taskId);
    
    res.json({
      task: {
        id: task.id,
        status: task.status,
        originalRequest: task.originalRequest,
        subTasks: task.subTasks,
        reports: reports.length
      },
      verification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Task status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Coding Agent file generation endpoint
app.post('/api/coding-agent/generate-file', async (req, res) => {
  try {
    const { fileName, fileType, content, description, agentId } = req.body;
    
    if (!fileName || !fileType || !content) {
      return res.status(400).json({ error: 'fileName, fileType, and content are required' });
    }
    
    // Generate file metadata
    const file = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      type: fileType,
      content: content,
      size: Buffer.byteLength(content, 'utf8'),
      createdAt: new Date().toISOString(),
      agentId: agentId || 'coding-agent',
      description: description || ''
    };
    
    // Store file in memory (in production, use proper file storage)
    if (!global.generatedFiles) {
      global.generatedFiles = new Map();
    }
    global.generatedFiles.set(file.id, file);
    
    res.json({
      success: true,
      file: file,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('File generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get generated files endpoint
app.get('/api/coding-agent/files', (req, res) => {
  try {
    const files = global.generatedFiles ? Array.from(global.generatedFiles.values()) : [];
    
    res.json({
      success: true,
      files: files,
      count: files.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Download file endpoint
app.get('/api/coding-agent/files/:fileId/download', (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!global.generatedFiles || !global.generatedFiles.has(fileId)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = global.generatedFiles.get(fileId);
    
    // Set appropriate headers for download
    const mimeTypes = {
      'html': 'text/html',
      'css': 'text/css',
      'javascript': 'application/javascript',
      'python': 'text/x-python',
      'json': 'application/json',
      'text': 'text/plain'
    };
    
    const mimeType = mimeTypes[file.type] || 'text/plain';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.send(file.content);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate final output endpoint
app.post('/api/tasks/:taskId/finalize', (req, res) => {
  try {
    const { taskId } = req.params;
    const finalOutput = agentCoordinator.generateFinalOutput(taskId);
    
    res.json({
      success: true,
      finalOutput,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Task finalization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Deep Research Agent API'
  });
});

// Agent status endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      {
        id: 'top-level-planning',
        name: 'Top-Level Planning Agent',
        status: 'active',
        description: 'Analyzes requests and creates comprehensive plans'
      },
      {
        id: 'research-agent',
        name: 'Research Agent',
        status: 'available',
        description: 'Conducts deep research on specified topics'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Get agent status
app.get('/api/agent-status', (req, res) => {
  res.json({
    agents: agentCoordinator.subAgents,
    activeTasks: agentCoordinator.activeTasks.size,
    totalReports: Array.from(agentCoordinator.agentReports.values()).reduce((sum, reports) => sum + reports.length, 0)
  });
});

// Get data flow information
app.get('/api/data-flow/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const dataFlow = agentCoordinator.getDataFlow(taskId);
    const taskData = agentCoordinator.getAllTaskData(taskId);
    
    res.json({
      success: true,
      taskId,
      dataFlow,
      taskData,
      summary: {
        totalDataExchanges: dataFlow.length,
        agentsWithData: Object.keys(taskData).length,
        lastUpdate: dataFlow.length > 0 ? dataFlow[dataFlow.length - 1].timestamp : null
      }
    });
  } catch (error) {
    console.error('Error getting data flow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all shared data for debugging
app.get('/api/debug/shared-data', (req, res) => {
  try {
    const allSharedData = {};
    const allDataFlow = {};
    
    for (const [taskId, data] of agentCoordinator.sharedData.entries()) {
      allSharedData[taskId] = data;
    }
    
    for (const [taskId, flow] of agentCoordinator.dataFlow.entries()) {
      allDataFlow[taskId] = flow;
    }
    
    res.json({
      success: true,
      sharedData: allSharedData,
      dataFlow: allDataFlow,
      statistics: {
        totalTasks: agentCoordinator.sharedData.size,
        totalDataExchanges: Object.values(allDataFlow).reduce((sum, flow) => sum + flow.length, 0)
      }
    });
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Deep Research Agent API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
  console.log(`Agents endpoint: http://localhost:${port}/api/agents`);
});

export default app;