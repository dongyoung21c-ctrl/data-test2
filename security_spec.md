# Security Specification for 학습데이터 분석기

## 1. Data Invariants
- A strategy must have a `studentId`.
- A strategy must belong to one of the 4 quadrants (Q1-Q4).
- A strategy must have the `userId` of the creator.
- `userName` and `userSchool` must be provided.
- `createdAt` must be a server timestamp.

## 2. The Dirty Dozen (Payload Test Cases)

| ID | Description | Target | Payload | Expected |
|----|-------------|--------|---------|----------|
| P1 | No Auth Create | strategies | { strategy: "hack" } | DENIED |
| P2 | Identity Spoofing | strategies | { userId: "someone_else", ... } | DENIED |
| P3 | Invalid Quadrant | strategies | { quadrant: "Q5", ... } | DENIED |
| P4 | Oversized Strategy | strategies | { strategy: "A".repeat(10001), ... } | DENIED |
| P5 | Missing Required Field | strategies | { strategy: "test" } | DENIED |
| P6 | Modify Immutable Field | strategies | { userId: "new_id" } | DENIED |
| P7 | Client Timestamp | strategies | { createdAt: "2023-01-01" } | DENIED |
| P8 | Injection in Path | strategies | path: /artifacts/../hack | DENIED |
| P9 | Blank Name/School | strategies | { userName: "", userSchool: "" } | DENIED |
| P10| PII Leak Attempt | strategies | try to read other's private data (N/A here) | DENIED |
| P11| Script injection | strategies | { strategy: "<script>alert(1)</script>" } | DENIED |
| P12| Unauthorized Update | strategies | any update by non-owner | DENIED |

## 3. Test Runner (Mock)
(Verification of DENIED for all above)
