---
name: code-review
description: Helps with a code review. Use when you need to do Code Review.
---
# **Code Review & Change Safety Skill**

## **🚀 Context & Role**

Role: You are the Production Gatekeeper.  
Trigger: Use this skill when the user asks you to "review," "audit," "check," or "verify" code or a Pull Request (PR).  
Goal: Ensure code is safe, reversible, and compliant with PRODUCTION-STANDARDS.md (/home/mayamint/.gemini/GEMINI.md) before it reaches production.

## **📋 Phase 1: The Pre-Merge Checklist (Section 6\)**

*Before approving any code, verify every item below. If an item fails, reject the changes with a specific error.*

### **1\. Functional Integrity**

* \[ \] **Automated Tests:** Do all new code paths have unit/integration tests? (Blocker)  
* \[ \] **CI Checks:** Are there any linting errors or failing checks?

### **2\. Security & Safety**

* \[ \] **Secrets:** Scan for hardcoded credentials, API keys, or tokens.  
* \[ \] **Dependencies:** Are all new dependencies necessary and free of known vulnerabilities?  
* \[ \] **Sanitization:** Are all inputs validated (Zod/Joi)? Are all SQL queries parameterized?

### **3\. Reliability**

* \[ \] **Error Handling:** Are try/catch blocks present for async calls? Are errors logged, not swallowed?  
* \[ \] **Performance:** Check for unbounded loops, N+1 queries, or large data rendering without virtualization.

### **4\. Standards Compliance**

* \[ \] **Type Safety:** Ensure no any is used without explicit justification.  
* \[ \] **Naming:** Verify consistent naming (e.g., camelCase for JS/TS) throughout.  
* \[ \] **Accessibility:** Check that UI changes include labels, alt text, and support keyboard navigation.

## **🛡️ Phase 2: Change Safety Protocol (Section 7\)**

*Assess the risk of this change to determine the deployment strategy.*

### **Step 1: Risk Classification**

* **Critical:** Changes to Auth, Payments, or Core Infrastructure. (Requires 2+ reviewers).  
* **High:** Changes to DB Schema or public APIs.  
* **Medium:** Standard feature logic.  
* **Low:** UI tweaks, documentation, non-functional refactors.

### **Step 2: Blast Radius Analysis**

* Identify which services, data, or customer segments are affected.  
* *Instruction:* If the blast radius is large, suggest a **Canary Release** or **Feature Flag**.

### **Step 3: Rollback Strategy**

* \[ \] Confirm a rollback plan exists (e.g., "Revert commit" or "Run migration down script").  
* \[ \] Ensure DB changes are backward-compatible.

## **🚫 Phase 3: Anti-Pattern Hunter (Section 5\)**

*Actively scan the code for these specific "Forbidden Patterns". If found, flag them immediately.*

| Pattern | Detection Signal | Fix Recommendation |
| :---- | :---- | :---- |
| **Fat Controller** | Controller file contains validation \+ DB logic. | Split into Controller \-\> Service \-\> Repository. |
| **Inconsistent Naming** | Id vs id, user\_name vs userName. | Enforce one style (camelCase). |
| **The "Any" Trap** | arg: any or const x: any\[\]. | Use unknown or define an interface. |
| **Console Logs** | console.log() left in code. | Use structured logger or remove. |
| **Unhandled Promises** | async call without await or .catch. | Wrap in try/catch or return the promise. |
| **Prop Drilling** | Props passed down \>3 layers deep. | Suggest Context API or Zustand/Redux. |
| **Effect Cleanup** | useEffect with listeners/intervals but no return. | Add cleanup function. |
| **Array Index Key** | key={index} in React lists. | Use key={item.id}. |

## **📝 Output Format**

When reporting your findings, use this structure:

**🛑 Audit Status: \[PASS / FAIL / WARNING\]**

**1\. Critical Blockers (Must Fix)**

* \[Location\]: \[Issue Description\]

**2\. Advisory Findings (Recommended)**

* \[Location\]: \[Optimization Suggestion\]

**3\. Risk Assessment**

* **Class:** \[High/Medium/Low\]  
* **Rollback Plan:** \[Verified/Missing\]