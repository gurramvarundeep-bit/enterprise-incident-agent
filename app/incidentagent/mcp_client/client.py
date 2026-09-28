import os
import logging

from mcp.client.streamable_http import streamablehttp_client
from strands.tools.mcp.mcp_client import MCPClient

logger = logging.getLogger(__name__)

GATEWAY_URL_ENV = "AGENTCORE_GATEWAY_INCIDENTTOOLSGATEWAY_URL"


def get_streamable_http_mcp_client(
    authorization_header: str | None = None,
) -> MCPClient | None:
    """
    Create a Strands MCP client for the deployed AgentCore Gateway.

    The Gateway URL comes from the Runtime environment.
    The bearer credential is supplied per invocation and is never logged.
    """

    gateway_url = os.getenv(GATEWAY_URL_ENV)

    if not gateway_url:
        logger.info("AgentCore Gateway URL is not configured.")
        return None

    if not authorization_header:
        logger.info("Gateway Authorization header is unavailable.")
        return None

    return MCPClient(
        lambda: streamablehttp_client(
            gateway_url,
            headers={
                "Authorization": authorization_header,
            },
        )
    )
