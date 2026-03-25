from importlib.metadata import version
from typing import List, TypedDict

from fastapi import FastAPI
from langgraph.graph import END, StateGraph


app = FastAPI(title="vikiclow-langgraph-probe")


class ProbeState(TypedDict):
    mission_id: str
    trace: List[str]


def sovereign(state: ProbeState) -> ProbeState:
    return {
        "mission_id": state["mission_id"],
        "trace": [*state.get("trace", []), "sovereign"],
    }


def verifier(state: ProbeState) -> ProbeState:
    return {
        "mission_id": state["mission_id"],
        "trace": [*state.get("trace", []), "verifier"],
    }


graph_builder = StateGraph(ProbeState)
graph_builder.add_node("sovereign", sovereign)
graph_builder.add_node("verifier", verifier)
graph_builder.set_entry_point("sovereign")
graph_builder.add_edge("sovereign", "verifier")
graph_builder.add_edge("verifier", END)
graph = graph_builder.compile()


@app.get("/ok")
def ok():
    return {
        "ok": True,
        "service": "langgraph-probe",
        "langgraph_version": version("langgraph"),
    }


@app.get("/metadata")
def metadata():
    return {
        "service": "langgraph-probe",
        "langgraph_version": version("langgraph"),
        "runtime": "uvicorn",
        "graph_id": "vikiclow-runtime-proof",
        "nodes": ["sovereign", "verifier"],
        "entry_point": "sovereign",
    }


@app.post("/invoke")
def invoke(payload: dict):
    mission_id = str(payload.get("mission_id") or "langgraph-proof")
    trace = payload.get("trace")
    if not isinstance(trace, list):
        trace = []
    result = graph.invoke({"mission_id": mission_id, "trace": [str(item) for item in trace]})
    return {
        "ok": True,
        "service": "langgraph-probe",
        "graph_id": "vikiclow-runtime-proof",
        "result": result,
    }
