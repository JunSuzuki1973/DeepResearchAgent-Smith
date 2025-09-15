#!/usr/bin/env python3

import os
import sys
import asyncio
sys.path.append('src')

from dotenv import load_dotenv
from models import model_manager
from models.base import ChatMessage

async def test_api_keys():
    # Load environment variables
    load_dotenv()
    
    print("Testing API Keys...")
    print(f"OpenAI API Key: {os.getenv('OPENAI_API_KEY')[:20]}...")
    print(f"Anthropic API Key: {os.getenv('ANTHROPIC_API_KEY')[:20]}...")
    
    # Initialize models
    try:
        model_manager.init_models(use_local_proxy=False)
        print("\nModels initialized successfully!")
        
        # List available models
        available_models = list(model_manager.registed_models.keys())
        print(f"\nAvailable models: {available_models}")
        
        # Create test message
        test_message = ChatMessage(
            role="user",
            content="Hello, this is a test message. Please respond with 'API test successful'."
        )
        
        # Test OpenAI model
        print("\nTesting OpenAI GPT-4o...")
        if 'gpt-4o' in model_manager.registed_models:
            openai_model = model_manager.registed_models['gpt-4o']
            try:
                response = await openai_model.generate([test_message], max_tokens=50)
                print(f"OpenAI Response: {response.content}")
            except Exception as e:
                print(f"OpenAI Error: {e}")
        
        # Test Anthropic model
        print("\nTesting Anthropic Claude...")
        claude_models = [m for m in available_models if 'claude' in m.lower()]
        if claude_models:
            claude_model_name = claude_models[0]
            print(f"Using model: {claude_model_name}")
            claude_model = model_manager.registed_models[claude_model_name]
            try:
                response = await claude_model.generate([test_message], max_tokens=50)
                print(f"Claude Response: {response.content}")
            except Exception as e:
                print(f"Claude Error: {e}")
        
    except Exception as e:
        print(f"Model initialization error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_keys())