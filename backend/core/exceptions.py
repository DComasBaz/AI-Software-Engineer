class AppError(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class SessionNotFoundError(AppError):
    def __init__(self, session_id: str):
        super().__init__(f"Session '{session_id}' not found", status_code=404)


class ProjectNotFoundError(AppError):
    def __init__(self, path: str):
        super().__init__(f"Project folder not found: {path}", status_code=404)


class AgentError(AppError):
    def __init__(self, message: str):
        super().__init__(f"Agent execution failed: {message}", status_code=500)


class InvalidRecursionLimitError(AppError):
    def __init__(self, max_limit: int):
        super().__init__(
            f"recursion_limit must be between 1 and {max_limit}",
            status_code=422,
        )


class TaskCancelledError(Exception):
    """Raised when a session is cancelled by the user.

    Intentionally does NOT extend AppError — this is a control-flow signal
    caught explicitly in run_agent_task, not an HTTP error.
    """