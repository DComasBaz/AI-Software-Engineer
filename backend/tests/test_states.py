"""
Tests for agent/states.py

Run with:
    pytest tests/test_states.py -v
"""
import pytest
from pydantic import ValidationError

from agent.states import CoderState, File, ImplementationTask, Plan, TaskPlan


# ---------------------------------------------------------------------------
# File
# ---------------------------------------------------------------------------

class TestFile:
    def test_valid(self):
        f = File(path="src/main.py", purpose="entry point")
        assert f.path == "src/main.py"
        assert f.purpose == "entry point"

    def test_missing_fields(self):
        with pytest.raises(ValidationError):
            File()

    def test_missing_purpose(self):
        with pytest.raises(ValidationError):
            File(path="src/main.py")


# ---------------------------------------------------------------------------
# Plan
# ---------------------------------------------------------------------------

class TestPlan:
    def _make(self, **overrides):
        defaults = dict(
            name="MyApp",
            description="A test app",
            techstack="python",
            features=["auth", "dashboard"],
            files=[File(path="main.py", purpose="entry")],
        )
        defaults.update(overrides)
        return Plan(**defaults)

    def test_valid(self):
        p = self._make()
        assert p.name == "MyApp"
        assert len(p.features) == 2
        assert len(p.files) == 1

    def test_empty_features_allowed(self):
        p = self._make(features=[])
        assert p.features == []

    def test_empty_files_allowed(self):
        p = self._make(files=[])
        assert p.files == []

    def test_missing_name_fails(self):
        with pytest.raises(ValidationError):
            Plan(description="x", techstack="py", features=[], files=[])


# ---------------------------------------------------------------------------
# ImplementationTask
# ---------------------------------------------------------------------------

class TestImplementationTask:
    def test_valid(self):
        t = ImplementationTask(filepath="src/app.py", task_description="Write the main loop")
        assert t.filepath == "src/app.py"

    def test_missing_filepath(self):
        with pytest.raises(ValidationError):
            ImplementationTask(task_description="do something")

    def test_missing_description(self):
        with pytest.raises(ValidationError):
            ImplementationTask(filepath="x.py")


# ---------------------------------------------------------------------------
# TaskPlan
# ---------------------------------------------------------------------------

class TestTaskPlan:
    def _task(self, n=1):
        return ImplementationTask(filepath=f"file{n}.py", task_description=f"task {n}")

    def test_valid(self):
        tp = TaskPlan(implementation_steps=[self._task(1), self._task(2)])
        assert len(tp.implementation_steps) == 2

    def test_empty_steps(self):
        tp = TaskPlan(implementation_steps=[])
        assert tp.implementation_steps == []

    def test_extra_fields_allowed(self):
        """TaskPlan has model_config extra='allow'."""
        tp = TaskPlan(implementation_steps=[], plan="some plan object")
        assert tp.plan == "some plan object"


# ---------------------------------------------------------------------------
# CoderState
# ---------------------------------------------------------------------------

class TestCoderState:
    def _task_plan(self):
        return TaskPlan(
            implementation_steps=[
                ImplementationTask(filepath="a.py", task_description="step 1"),
                ImplementationTask(filepath="b.py", task_description="step 2"),
            ]
        )

    def test_defaults(self):
        cs = CoderState(task_plan=self._task_plan())
        assert cs.current_step_idx == 0
        assert cs.current_file_content is None

    def test_step_idx_increments(self):
        cs = CoderState(task_plan=self._task_plan(), current_step_idx=1)
        assert cs.current_step_idx == 1

    def test_current_file_content(self):
        cs = CoderState(task_plan=self._task_plan(), current_file_content="print('hi')")
        assert cs.current_file_content == "print('hi')"

    def test_missing_task_plan_fails(self):
        with pytest.raises(ValidationError):
            CoderState()
