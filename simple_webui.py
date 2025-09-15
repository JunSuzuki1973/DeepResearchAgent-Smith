#!/usr/bin/env python3

import streamlit as st
import asyncio
import sys
import os
from pathlib import Path
from argparse import Namespace

root = str(Path(__file__).resolve().parents[0])
sys.path.append(root)
sys.path.append('src')

from src.models import model_manager
from src.agent import create_agent
from src.config import config
from src.logger import logger
from configs.config_general import general_agent_config

def init_session_state():
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'agent' not in st.session_state:
        st.session_state.agent = None

async def create_agent_async(model_name):
    try:
        st.write(f"🔄 Initializing configuration...")
        # Initialize the configuration
        config_path = os.path.join(root, "configs", "config_general.py")
        # Create args namespace for config initialization
        args = Namespace(cfg_options=None)
        config.init_config(config_path, args)
        st.write(f"✅ Configuration initialized")
        
        st.write(f"🔄 Initializing logger...")
        # Initialize the logger
        logger.init_logger(log_path=config.log_path)
        st.write(f"✅ Logger initialized")
        
        st.write(f"🔄 Initializing models...")
        # Initialize models
        model_manager.init_models(use_local_proxy=False)
        st.write(f"✅ Models initialized successfully")
        
        st.write(f"🔄 Updating model configuration to: {model_name}")
        # Update config with selected model
        config.agent_config['model_id'] = model_name
        st.write(f"✅ Model configuration updated")
        
        st.write(f"🔄 Creating agent...")
        # Create agent
        agent = await create_agent(config)
        st.write(f"✅ Agent created successfully")
        return agent, None
    except Exception as e:
        import traceback
        error_details = f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        st.write(f"❌ Error occurred: {error_details}")
        return None, error_details

def create_agent_wrapper(model_name):
    return asyncio.run(create_agent_async(model_name))

async def run_agent_task(agent, task):
    try:
        result = await agent.run(task)
        return result, None
    except Exception as e:
        return None, str(e)

def main():
    st.set_page_config(
        page_title="DeepResearchAgent WebUI",
        page_icon="🤖",
        layout="wide"
    )
    
    st.title("🤖 DeepResearchAgent WebUI")
    st.markdown("Simple web interface for testing DeepResearchAgent")
    
    init_session_state()
    
    # Sidebar for model selection
    with st.sidebar:
        st.header("Settings")
        
        # Model selection
        available_models = [
            "gpt-4o",
            "gpt-4.1", 
            "gemini-2.5-pro",
            "qwen2.5-7b-instruct",
            "claude37-sonnet"
        ]
        
        selected_model = st.selectbox(
            "Select Model",
            available_models,
            index=2  # Default to gemini-2.5-pro
        )
        
        if st.button("Initialize Agent"):
            with st.spinner("Initializing agent..."):
                agent, error = create_agent_wrapper(selected_model)
                if agent:
                    st.session_state.agent = agent
                    st.success(f"Agent initialized with {selected_model}")
                else:
                    st.error(f"Failed to initialize agent: {error}")
        
        # Agent status
        if st.session_state.agent:
            st.success("✅ Agent Ready")
        else:
            st.warning("⚠️ Agent Not Initialized")
        
        # Clear chat
        if st.button("Clear Chat"):
            st.session_state.messages = []
            st.rerun()
    
    # Main chat interface
    st.header("Chat Interface")
    
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Enter your task or question..."):
        if not st.session_state.agent:
            st.error("Please initialize an agent first!")
            return
        
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    # Run agent task
                    result, error = asyncio.run(run_agent_task(st.session_state.agent, prompt))
                    
                    if result:
                        response = f"Task completed successfully!\n\nResult: {result}"
                        st.markdown(response)
                        st.session_state.messages.append({"role": "assistant", "content": response})
                    else:
                        error_msg = f"Error occurred: {error}"
                        st.error(error_msg)
                        st.session_state.messages.append({"role": "assistant", "content": error_msg})
                        
                except Exception as e:
                    error_msg = f"Unexpected error: {str(e)}"
                    st.error(error_msg)
                    st.session_state.messages.append({"role": "assistant", "content": error_msg})
    
    # Example tasks
    st.header("Example Tasks")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Calculate 2+2"):
            if st.session_state.agent:
                st.session_state.messages.append({"role": "user", "content": "Calculate 2+2"})
                st.rerun()
    
    with col2:
        if st.button("🌍 What is the capital of Japan?"):
            if st.session_state.agent:
                st.session_state.messages.append({"role": "user", "content": "What is the capital of Japan?"})
                st.rerun()
    
    with col3:
        if st.button("🔍 Explain quantum computing"):
            if st.session_state.agent:
                st.session_state.messages.append({"role": "user", "content": "Explain quantum computing in simple terms"})
                st.rerun()

if __name__ == "__main__":
    main()