import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_litellm_direct():
    """Test LiteLLM directly with proper configuration"""
    try:
        import litellm
        
        # Set up litellm configuration
        litellm.set_verbose = True
        
        # Test OpenAI model
        print("Testing OpenAI with LiteLLM...")
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            try:
                response = await litellm.acompletion(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": "Hello, this is a test."}],
                    api_key=openai_key,
                    timeout=30
                )
                print(f"OpenAI Success: {response.choices[0].message.content}")
            except Exception as e:
                print(f"OpenAI Error: {e}")
        else:
            print("OpenAI API key not found")
        
        # Test Anthropic model
        print("\nTesting Anthropic with LiteLLM...")
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            try:
                response = await litellm.acompletion(
                    model="claude-3-5-sonnet-20241022",
                    messages=[{"role": "user", "content": "Hello, this is a test."}],
                    api_key=anthropic_key,
                    timeout=30
                )
                print(f"Anthropic Success: {response.choices[0].message.content}")
            except Exception as e:
                print(f"Anthropic Error: {e}")
        else:
            print("Anthropic API key not found")
            
    except ImportError:
        print("LiteLLM not installed")
    except Exception as e:
        print(f"General error: {e}")

if __name__ == "__main__":
    asyncio.run(test_litellm_direct())