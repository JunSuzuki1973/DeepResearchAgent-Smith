import os
import asyncio
from dotenv import load_dotenv
from src.models.models import ModelManager
from src.models.base import ChatMessage

# Load environment variables
load_dotenv()

async def test_model_manager():
    """Test ModelManager with actual configuration"""
    try:
        # Initialize ModelManager
        model_manager = ModelManager()
        model_manager.init_models(use_local_proxy=False)
        
        print("Registered models:")
        for name, model in model_manager.registed_models.items():
            print(f"  - {name}: {type(model).__name__}")
        
        # Test gpt-4o model
        if "gpt-4o" in model_manager.registed_models:
            print("\nTesting gpt-4o model...")
            model = model_manager.registed_models["gpt-4o"]
            print(f"Model ID: {model.model_id}")
            print(f"API Key: {model.api_key[:10] if model.api_key else 'None'}...")
            print(f"API Base: {model.api_base}")
            print(f"Client: {type(model.client).__name__}")
            
            try:
                messages = [ChatMessage(role="user", content="Hello, this is a test.")]
                response = await model.generate(messages)
                print(f"Success: {response.content}")
            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
        
        # Test claude37-sonnet model
        if "claude37-sonnet" in model_manager.registed_models:
            print("\nTesting claude37-sonnet model...")
            model = model_manager.registed_models["claude37-sonnet"]
            print(f"Model ID: {model.model_id}")
            print(f"API Key: {model.api_key[:10] if model.api_key else 'None'}...")
            print(f"API Base: {model.api_base}")
            print(f"Client: {type(model.client).__name__}")
            
            try:
                messages = [ChatMessage(role="user", content="Hello, this is a test.")]
                response = await model.generate(messages)
                print(f"Success: {response.content}")
            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
                
    except Exception as e:
        print(f"General error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_model_manager())