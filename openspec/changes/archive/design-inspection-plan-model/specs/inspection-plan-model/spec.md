# 检验计划模型定义 (Inspection Plan Model Definition)

## ADDED Requirements

### Requirement: The Inspection Plan should contain base fields including plan code, name, organization, type, material, and association to a scheme.
The system MUST allow creating an inspection plan with comprehensive base attributes that accurately define its identity, target organization, and material scope, while linking it to a definitive scheme.

#### Scenario: Viewing plan details
Given a new inspection plan is created
When the user examines its basic information
Then there should be inputs for Organization ID, Inspection Type (IQC, IPQC, etc.), Material ID, and Scheme ID.

### Requirement: The Inspection Plan must support versioning and a multi-state lifecycle.
The system MUST track state changes across DRAFT, ACTIVE, and SUSPENDED lifetimes, and MUST automatically transition older variations when a new version is released.

#### Scenario: Plan lifecycle change
Given a drafted plan
When the plan is activated and subsequently a new revision is required
Then the old version should be marked as inactive/suspended and `is_latest_version` should update accordingly.

### Requirement: The plan must support varied trigger configurations (Event, Time/Cron, Quantity).
The system MUST offer versatile trigger methods such as business event integration, scheduled cron tasks, and quantity boundaries in order to automatically spawn inspection tasks.

#### Scenario: Setting an automated trigger
Given a plan definition form
When configuring triggers
Then the user can set a Cron schedule for periodic patrols or input ERP event rules for receiving.

### Requirement: The plan must enable parameter overriding for scheme defaults.
The system MUST allow localized modifications of threshold/limit values derived from the original scheme definitions without modifying the base scheme. This override MUST be stored securely within the plan payload.

#### Scenario: Refining thresholds at plan level
Given an inspection plan utilizing an existing scheme
When the user edits limits (e.g., upper limit tightened)
Then the system stores these as `parameter_override` JSON, preserving original scheme values intact.

### Requirement: The plan must feature quick response locking rules (e.g., email alerts).
The system MUST be able to immediately dispatch external alerts or notifications when specific blocking conditions or targeted critical defects are detected during task evaluation.

#### Scenario: Alerting quality manager on critical defects
Given a configured plan with locking logic enabled
When the system identifies the targeted defect during task review matching this rule
Then an immediate alert is dispatched (via email/DingTalk) before final task disposition.
