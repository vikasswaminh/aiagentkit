"""Organization management client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from google.protobuf import struct_pb2

from agent_platform.proto import agent_platform_pb2 as pb2


@dataclass
class Org:
    org_id: str
    name: str


class OrgClient:
    """Client for organization CRUD operations."""

    def __init__(self, stub: Any) -> None:
        self._stub = stub

    def create(self, name: str, metadata: dict | None = None) -> Org:
        meta = struct_pb2.Struct()
        if metadata:
            meta.update(metadata)
        resp = self._stub.CreateOrganization(
            pb2.CreateOrgRequest(name=name, metadata=meta)
        )
        return Org(org_id=resp.org_id, name=resp.name)

    def get(self, org_id: str) -> Org:
        resp = self._stub.GetOrganization(pb2.GetOrgRequest(org_id=org_id))
        return Org(org_id=resp.org_id, name=resp.name)

    def list(self) -> list[Org]:
        resp = self._stub.ListOrganizations(pb2.ListOrgsRequest())
        return [Org(org_id=o.org_id, name=o.name) for o in resp.organizations]

    def delete(self, org_id: str) -> bool:
        resp = self._stub.DeleteOrganization(pb2.DeleteOrgRequest(org_id=org_id))
        return resp.success
