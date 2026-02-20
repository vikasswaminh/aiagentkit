"""Tests for OrgService."""

from agent_platform.control_plane.orgs import OrgService


class TestOrgService:
    def test_create_org(self, org_service):
        org = org_service.create("Acme Corp")
        assert org.name == "Acme Corp"
        assert org.org_id

    def test_get_org(self, org_service):
        org = org_service.create("Acme Corp")
        fetched = org_service.get(org.org_id)
        assert fetched is not None
        assert fetched.org_id == org.org_id

    def test_get_nonexistent_returns_none(self, org_service):
        assert org_service.get("nonexistent") is None

    def test_list_orgs(self, org_service):
        org_service.create("A")
        org_service.create("B")
        assert len(org_service.list()) == 2

    def test_delete_org(self, org_service):
        org = org_service.create("ToDelete")
        assert org_service.delete(org.org_id) is True
        assert org_service.get(org.org_id) is None

    def test_delete_nonexistent(self, org_service):
        assert org_service.delete("nonexistent") is False

    def test_exists(self, org_service):
        org = org_service.create("Exists")
        assert org_service.exists(org.org_id) is True
        assert org_service.exists("nope") is False

    def test_create_with_metadata(self, org_service):
        org = org_service.create("Meta Corp", metadata={"tier": "enterprise"})
        assert org.metadata == {"tier": "enterprise"}
