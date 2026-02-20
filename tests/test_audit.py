"""Tests for AuditLog — append-only, query, delegation chains."""

from agent_platform.gateway.audit import AuditLog
from agent_platform.shared.models import AuditEntry


class TestAuditLog:
    def test_append_and_count(self):
        log = AuditLog()
        log.append(AuditEntry(org_id="org-1", action="tool_call"))
        assert log.count == 1

    def test_query_by_org(self):
        log = AuditLog()
        log.append(AuditEntry(org_id="org-1", action="a"))
        log.append(AuditEntry(org_id="org-2", action="b"))
        results = log.query(org_id="org-1")
        assert len(results) == 1
        assert results[0].org_id == "org-1"

    def test_query_by_agent(self):
        log = AuditLog()
        log.append(AuditEntry(org_id="org-1", agent_id="a1", action="x"))
        log.append(AuditEntry(org_id="org-1", agent_id="a2", action="y"))
        results = log.query(agent_id="a1")
        assert len(results) == 1

    def test_query_limit(self):
        log = AuditLog()
        for i in range(10):
            log.append(AuditEntry(org_id="org-1", action=f"action-{i}"))
        results = log.query(limit=3)
        assert len(results) == 3

    def test_query_newest_first(self):
        log = AuditLog()
        log.append(AuditEntry(org_id="org-1", action="first"))
        log.append(AuditEntry(org_id="org-1", action="second"))
        results = log.query()
        assert results[0].action == "second"

    def test_delegation_chain(self):
        log = AuditLog()
        log.append(AuditEntry(execution_id="e1", action="policy_check"))
        log.append(AuditEntry(execution_id="e1", action="tool_call"))
        log.append(AuditEntry(execution_id="e2", action="other"))
        chain = log.get_delegation_chain("e1")
        assert len(chain) == 2

    def test_query_by_action(self):
        log = AuditLog()
        log.append(AuditEntry(action="tool_call"))
        log.append(AuditEntry(action="policy_check"))
        results = log.query(action="tool_call")
        assert len(results) == 1
