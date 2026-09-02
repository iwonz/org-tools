## MODIFIED Requirements

### Requirement: Live tabs converge without browser persistence
Both runtimes SHALL synchronize validated scoped state through `BroadcastChannel` using unique tab
origins and deterministic logical stamps. A new tab SHALL make a bounded series of requests for the
latest complete state from live peers so channel-registration timing cannot silently miss an
already-live peer. Pages SHALL start blank when no peer responds and MUST NOT persist organization
or durable UI snapshots in cookies, IndexedDB, local storage, session storage, or Cache Storage.
Simultaneous independent tab updates SHALL converge through deterministic last-write-wins and SHALL
NOT be presented as collaborative merge behavior.

#### Scenario: New static tab with a live peer
- **WHEN** a Pages tab opens while another same-origin tab holds current state
- **THEN** it receives and applies the peer's latest valid complete snapshot even when its first
  request overlaps browser channel registration

#### Scenario: Final static tab closes
- **WHEN** the last Pages tab closes and the application is opened again
- **THEN** a blank state is created because no organization snapshot was persisted

#### Scenario: Origin suppression
- **WHEN** a tab receives its own message, a duplicate peer response, or an already applied stamp
- **THEN** it ignores the message without rebroadcasting or mutating state

#### Scenario: Concurrent tab messages
- **WHEN** two tabs emit independently before observing each other
- **THEN** every live tab deterministically selects the same winning stamped state
