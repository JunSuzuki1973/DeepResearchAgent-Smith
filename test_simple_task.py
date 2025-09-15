import asyncio
import sys
from pathlib import Path

root = str(Path(__file__).resolve().parents[0])
sys.path.append(root)

from src.logger import logger
from src.config import config
from src.models import model_manager
from src.agent import create_agent

async def main():
    # Create args object
    class Args:
        def __init__(self):
            self.cfg_options = None
        
        def __contains__(self, key):
            return hasattr(self, key)
    
    args = Args()
    
    # Initialize the configuration
    config.init_config("configs/config_general.py", args)

    # Initialize the logger
    logger.init_logger(log_path=config.log_path)
    logger.info(f"| Logger initialized at: {config.log_path}")

    # Register models
    model_manager.init_models(use_local_proxy=False)
    logger.info("| Registered models: %s", ", ".join(model_manager.registed_models.keys()))

    # Create agent
    agent = await create_agent(config)
    logger.visualize_agent_tree(agent)

    # Run simple task
    task = "Calculate 2 + 3 and return the result."
    res = await agent.run(task)
    logger.info(f"| Result: {res}")
    print(f"Task completed successfully: {res}")

if __name__ == '__main__':
    asyncio.run(main())