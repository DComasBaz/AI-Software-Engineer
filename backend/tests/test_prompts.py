"""
Tests for agent/prompts.py

Run with:
    pytest tests/test_prompts.py -v
"""
from agent.prompts import architect_prompt, coder_prompt, planner_prompt


# ---------------------------------------------------------------------------
# planner_prompt
# ---------------------------------------------------------------------------

class TestPlannerPrompt:
    def test_new_project_contains_user_prompt(self):
        result = planner_prompt("Build a todo app")
        assert "Build a todo app" in result

    def test_new_project_no_modification_context(self):
        result = planner_prompt("Build a todo app")
        assert "MODIFY" not in result
        assert "EXISTING PROJECT" not in result

    def test_modification_contains_user_prompt(self):
        result = planner_prompt("Add dark mode", existing_project_context="some context")
        assert "Add dark mode" in result

    def test_modification_contains_existing_context(self):
        ctx = "### existing_files ###"
        result = planner_prompt("Fix bug", existing_project_context=ctx)
        assert ctx in result

    def test_modification_signals_modify(self):
        result = planner_prompt("Fix bug", existing_project_context="ctx")
        assert "MODIFY" in result or "modification" in result.lower()

    def test_returns_string(self):
        assert isinstance(planner_prompt("any prompt"), str)


# ---------------------------------------------------------------------------
# architect_prompt
# ---------------------------------------------------------------------------

class TestArchitectPrompt:
    def test_contains_plan(self):
        plan = "Plan: build auth module"
        result = architect_prompt(plan)
        assert plan in result

    def test_modification_mode_includes_note(self):
        result = architect_prompt("some plan", is_modification=True)
        # Should mention modification-specific guidance
        assert "existing" in result.lower() or "modification" in result.lower()

    def test_non_modification_omits_mod_note(self):
        result = architect_prompt("some plan", is_modification=False)
        # Should not contain modification-specific language
        assert "Review existing files" not in result

    def test_returns_string(self):
        assert isinstance(architect_prompt("plan"), str)


# ---------------------------------------------------------------------------
# coder_prompt
# ---------------------------------------------------------------------------

class TestCoderPrompt:
    def test_lists_available_tools(self):
        result = coder_prompt()
        assert "read_file" in result
        assert "write_file" in result
        assert "list_files" in result
        assert "get_current_directory" in result

    def test_warns_against_invalid_tools(self):
        result = coder_prompt()
        # Should explicitly tell the coder not to invent tool names
        assert "read_files" in result or "NOT" in result

    def test_modification_mode_includes_note(self):
        result = coder_prompt(is_modification=True)
        assert "MODIFICATION" in result or "modif" in result.lower()

    def test_non_modification_omits_note(self):
        result = coder_prompt(is_modification=False)
        assert "MODIFICATION MODE" not in result

    def test_returns_string(self):
        assert isinstance(coder_prompt(), str)

    def test_default_is_not_modification(self):
        """Default should be a new-project prompt."""
        result = coder_prompt()
        assert "MODIFICATION MODE" not in result
