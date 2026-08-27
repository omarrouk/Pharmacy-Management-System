# Software Requirements Specification (SRS)
## Pharmacy Management System

---

**Document Version:** 1.1
**Status:** Finalized Business Requirements

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Definitions](#2-system-definitions)
3. [Users and Roles](#3-users-and-roles)
4. [Roles and Permissions](#4-roles-and-permissions)
5. [Pharmacies](#5-pharmacies)
6. [Warehouses](#6-warehouses)
7. [User Management](#7-user-management)
8. [Authentication](#8-authentication)
9. [Drug Management](#9-drug-management)
10. [Alternative Drug Search](#10-alternative-drug-search)
11. [Drug Categories](#11-drug-categories)
12. [Manufacturers](#12-manufacturers)
13. [Batch / Lot Management](#13-batch--lot-management)
14. [Batch Selection](#14-batch-selection)
15. [Inventory](#15-inventory)
16. [Negative Stock](#16-negative-stock)
17. [Stock Movements](#17-stock-movements)
18. [Warehouse Stock Movements](#18-warehouse-stock-movements)
19. [Pharmacy Stock Movements](#19-pharmacy-stock-movements)
20. [Inventory Adjustment](#20-inventory-adjustment)
21. [Supply Requests](#21-supply-requests)
22. [Supply Request Approval](#22-supply-request-approval)
23. [Supply Request Cancellation](#23-supply-request-cancellation)
24. [Shipments](#24-shipments)
25. [Sending a Shipment](#25-sending-a-shipment)
26. [Receiving a Shipment](#26-receiving-a-shipment)
27. [Suppliers](#27-suppliers)
28. [Purchase Workflow](#28-purchase-workflow)
29. [Purchase Receiving](#29-purchase-receiving)
30. [Purchase Invoice](#30-purchase-invoice)
31. [Batch Correction](#31-batch-correction)
32. [Sales](#32-sales)
33. [Customer Information](#33-customer-information)
34. [Sales Invoice](#34-sales-invoice)
35. [Selling Prices](#35-selling-prices)
36. [Discounts](#36-discounts)
37. [Payment Methods](#37-payment-methods)
38. [Sales Inventory Update](#38-sales-inventory-update)
39. [Customer Returns](#39-customer-returns)
40. [Pharmacy Returns](#40-pharmacy-returns)
41. [Supplier Returns](#41-supplier-returns)
42. [Drug Destruction](#42-drug-destruction)
43. [Low Stock Alerts](#43-low-stock-alerts)
44. [Expiry Alerts](#44-expiry-alerts)
45. [Notifications](#45-notifications)
46. [Audit Logs](#46-audit-logs)
47. [Reports](#47-reports)
48. [Use Cases](#48-use-cases)
49. [Workflows](#49-workflows)
50. [Domain Entities](#50-domain-entities)
51. [REST API Requirements](#51-rest-api-requirements)
52. [Backend Architecture Requirements](#52-backend-architecture-requirements)
53. [MongoDB Requirements](#53-mongodb-requirements)
54. [Transactions and Data Integrity](#54-transactions-and-data-integrity)
55. [Security Requirements](#55-security-requirements)
56. [Testing Requirements](#56-testing-requirements)
57. [Non-Functional Requirements](#57-non-functional-requirements)
58. [Business Rules Summary](#58-business-rules-summary)
59. [Out of Scope](#59-out-of-scope)
60. [Open Technical Decisions](#60-open-technical-decisions)

---

## 1. Introduction

### 1.1 Purpose

The **Pharmacy Management System** is a production-oriented system for managing a network of pharmacies, warehouses, and their associated operations.

The system is intended for **internal use** by:

- System administrators
- Pharmacy admins (multi-location supervisors)
- Pharmacy managers
- Warehouse managers
- Pharmacists
- Pharmacy and warehouse employees

> Customers and patients are **not** direct users of the system.

### 1.2 Technology Stack

**Backend:**

- Node.js
- Express.js
- MongoDB

The system is built on a **REST API** architecture.

### 1.3 System Scope

The system covers:

- Pharmacy management
- Warehouse management
- User management
- Roles and permissions management
- Drug management
- Active ingredient management
- Drug category management
- Manufacturer management
- Batch management
- Inventory management
- Stock movement tracking
- Supply requests
- Shipments and receiving
- Supplier management
- Purchasing
- Purchase invoices
- Sales
- Sales invoices
- Returns
- Drug destruction
- Inventory adjustments
- Pricing and price history
- Alerts and notifications
- SMS notifications
- Audit logs
- Reports

---

## 2. System Definitions

| Term | Definition |
|---|---|
| **Pharmacy** | A retail outlet that sells drugs to customers and receives supply from one primary warehouse. |
| **Warehouse** | A storage facility that holds drugs and supplies pharmacies or other warehouses. Warehouses can purchase drugs from suppliers. |
| **Drug / Product** | A commercial pharmaceutical product that is managed, sold, and stored. |
| **Active Ingredient** | The active substance within a drug. Separated from the product entity to enable searching across drugs sharing the same ingredient. |
| **Category** | The classification/category of a drug. |
| **Batch / Lot** | A specific batch of a drug with a unique batch number, expiry date, and quantity that can be tracked independently. |
| **Inventory** | The current stock of a specific drug within a pharmacy or warehouse. |
| **Stock Movement** | Any operation that affects the quantity of inventory, such as a sale, receipt, supply transfer, or destruction. |
| **Supply Request** | A request for stock transfer from a pharmacy to its primary warehouse, or from one warehouse to another. |
| **Shipment** | The physical shipment prepared and dispatched based on an approved Supply Request. |
| **Supplier** | The external entity from which a warehouse purchases drugs. |
| **Audit Log** | An immutable, non-deletable record of important system operations. |

---

## 3. Users and Roles

The system supports the following fixed roles. These roles are defined by the system and cannot be added or removed.

### 3.1 System Admin

General system administrator with **full access** to all system features, including:

- Pharmacy management
- Warehouse management
- User management
- Role and permission management
- Drug and price management
- Supplier management
- All operations and reports
- Audit logs
- System settings

### 3.2 Pharmacy Admin

A supervisory role scoped across **multiple pharmacies and/or warehouses** (for example, a district or regional manager). The Pharmacy Admin holds the combined permissions of a Pharmacy Manager and a Warehouse Manager for every pharmacy and warehouse linked to them.

Key characteristics:

- Can be linked to one or more pharmacies and one or more warehouses simultaneously.
- Has full managerial authority over any linked pharmacy (equivalent to Pharmacy Manager permissions).
- Has full managerial authority over any linked warehouse (equivalent to Warehouse Manager permissions).
- Cannot perform operations on pharmacies or warehouses that are not linked to their account.

**Example:**

```
Pharmacy Admin: Ahmad
  Linked Pharmacies : Pharmacy A, Pharmacy B
  Linked Warehouses : Warehouse A
```

Ahmad can manage Pharmacy A, Pharmacy B, and Warehouse A with full managerial authority over each, but cannot access Pharmacy C or Warehouse B.

### 3.3 Pharmacy Manager

Manager of a **specific pharmacy**. Can also simultaneously act as an employee or pharmacist within the same pharmacy.

Responsibilities include:

- Managing pharmacy inventory
- Approving supply requests from the pharmacy
- Changing selling prices
- Managing pharmacy staff
- Viewing pharmacy-level reports

### 3.4 Warehouse Manager

Manager of a **specific warehouse**. Can simultaneously act as an employee of the same warehouse. A single user can manage more than one warehouse, but each warehouse remains an independent entity.

Responsibilities include:

- Approving purchase requests
- Self-approving purchase requests they create
- Approving supply requests directed to the warehouse
- Managing warehouse inventory
- Viewing warehouse-level reports

### 3.5 Pharmacist / Pharmacy Employee

A staff member or pharmacist working in a specific pharmacy, linked to that pharmacy.

### 3.6 Warehouse Employee

A staff member working in a specific warehouse.

---

## 4. Roles and Permissions

- The system uses fixed, predefined roles as defined in Section 3.
- Each role contains a defined set of permissions.
- Permissions are enforced on the **backend**.
- The system must support **resource-level scoping**.

**Example:**

```
User
  Role: Pharmacy Manager
  Pharmacy: Pharmacy A
```

This user cannot perform operations on Pharmacy B unless their permissions explicitly allow it.

**Pharmacy Admin scoping example:**

```
User
  Role: Pharmacy Admin
  Linked Pharmacies: Pharmacy A, Pharmacy B
  Linked Warehouses: Warehouse A
```

This user can manage Pharmacy A, Pharmacy B, and Warehouse A but has no access to Pharmacy C or Warehouse B.

> The frontend is **not** a security mechanism. All authorization decisions must be enforced on the backend.

---

## 5. Pharmacies

- The system supports multiple pharmacies.
- Each pharmacy is linked to **exactly one primary warehouse**.

```
Pharmacy A
    |
    v
Primary Warehouse A
```

- A pharmacy requests supply from its linked warehouse.
- A pharmacy cannot be linked to more than one primary warehouse at the same time.

---

## 6. Warehouses

- The system supports multiple warehouses.
- A single warehouse can serve multiple pharmacies.
- A warehouse can also supply another warehouse.

**Example:**

```
Warehouse A
    |
    v
Warehouse B
    |
    v
Pharmacy B
```

Warehouse B can supply drugs to Pharmacy B even if those drugs were originally received from Warehouse A. Each warehouse remains an independent entity.

---

## 7. User Management

The system must support:

- Creating users
- Editing users
- Deactivating users
- Assigning a role to a user
- Linking a user to their associated entity (pharmacy or warehouse)
- For Pharmacy Admin: linking to multiple pharmacies and/or warehouses
- Permission management via roles

Additional rules:

- A warehouse manager can manage more than one warehouse without merging those entities.
- A pharmacy manager can also be an employee or pharmacist in the same pharmacy.
- A Pharmacy Admin's linked entities are explicitly managed at the user account level.

---

## 8. Authentication

The system uses token-based authentication:

- **Access Token**
- **Refresh Token**

Tokens must be secured and their lifecycle managed properly. The system must verify:

- User credentials
- Account status and validity
- User permissions before executing sensitive operations

---

## 9. Drug Management

Drugs are managed as entities independent from their active ingredients.

**Core relationship:**

```
Active Ingredient
        |
        v
      Drug
        |
        v
     Category
```

- One active ingredient can be linked to multiple drugs.
- A drug can have more than one active ingredient.

**Required drug fields:**

| Field | Notes |
|---|---|
| Drug Name | |
| Active Ingredient(s) | Can be multiple |
| Category | |
| Manufacturer | |
| Dosage Form | |
| Concentration | |
| Barcode | |
| Current Selling Price | |
| Minimum Stock Threshold | Per location |

---

## 10. Alternative Drug Search

Users can search for drugs by active ingredient.

**Example:**

```
Search: Paracetamol
Result:
  - Drug A
  - Drug B
  - Drug C
```

The system displays all drugs containing the same active ingredient, enabling staff to suggest alternatives when a specific drug is unavailable.

---

## 11. Drug Categories

Each drug can be linked to a category.

The system must support:

- Creating categories
- Editing categories
- Deactivating categories when needed
- Searching drugs by category

---

## 12. Manufacturers

- The system must support registering the manufacturer associated with each drug.
- Manufacturers can be used in search, reporting, and product management.

---

## 13. Batch / Lot Management

Every quantity received for a drug must be traceable by batch.

**Each batch must contain:**

| Field | Notes |
|---|---|
| Drug | |
| Batch Number | |
| Expiry Date | |
| Quantity | |
| Source | When applicable |
| Receipt Data | When applicable |

A drug can have multiple batches in the same location.

**Example:**

```
Warehouse A
  +-- Panadol
       |-- Batch A
       |    Quantity: 100
       |    Expiry: 2027-01-01
       |
       +-- Batch B
            Quantity: 200
            Expiry: 2027-06-01
```

---

## 14. Batch Selection

When an operation requires batch selection (e.g., a sale), the system defaults to selecting the batch with the **earliest expiry date** (FEFO - First Expiry, First Out).

```
Earliest Expiry --> Selected Batch
```

- Authorized users can override the selected batch.
- The system allows expired batches to exist in inventory.
- The system allows receiving expired batches.

---

## 15. Inventory

Inventory is tracked independently for each pharmacy and warehouse.

**Example:**

| Location | Panadol Stock |
|---|---|
| Warehouse A | 500 |
| Warehouse B | 200 |
| Pharmacy A | 50 |
| Pharmacy B | 30 |

- Inventory is tracked at the **batch level**.

---

## 16. Negative Stock

The system **allows creating a supply request or sale that exceeds available stock**, but **does not allow accepting or executing an operation that would result in negative stock**.

**Example:**

```
Available = 5
Required  = 7
Result    = Request CAN be submitted
            BUT cannot be fulfilled / accepted (would result in -2)
```

- A pharmacy or warehouse **may submit** a request for a quantity greater than current available stock.
- The system **will reject** the actual execution (shipment send, sale, etc.) if the available quantity is insufficient at the time of fulfillment.
- This rule applies to all operations that decrease inventory at the point of execution.

---

## 17. Stock Movements

Every change in inventory must produce a corresponding stock movement record.

**Required fields per movement:**

| Field | Notes |
|---|---|
| Movement Type | |
| Drug | |
| Batch | |
| Quantity | |
| Source / Destination | When applicable |
| User | |
| Timestamp | |
| Reference | Linked operation |

---

## 18. Warehouse Stock Movements

Supported warehouse movement types:

- Purchase Receiving
- Supply to Pharmacy
- Supply to Warehouse
- Return from Pharmacy
- Return to Supplier
- Destruction
- Inventory Adjustment

---

## 19. Pharmacy Stock Movements

Supported pharmacy movement types:

- Supply Receiving
- Sale
- Customer Return
- Return to Warehouse
- Destruction
- Inventory Adjustment

---

## 20. Inventory Adjustment

Authorized users may perform inventory adjustments.

- A **reason is mandatory** for every adjustment.

**Example:**

```
Current Quantity : 100
Adjustment       : -3
Reason           : Damaged Items
New Quantity     : 97
```

- A Stock Movement and Audit Log are recorded.
- Historical movement records are **not altered**.

---

## 21. Supply Requests

The system supports two types of supply requests:

- Pharmacy to Primary Warehouse
- Warehouse to Warehouse

The requesting entity (the one that needs the stock) creates the request.

**Request data includes:**

| Field |
|---|
| Requester |
| Source |
| Destination |
| Items and Requested Quantities |
| Approval Information |
| Status |
| Rejection / Modification Reasons |


---

## 22. Supply Request Approval

A supply request starts with the status **Pending Approval**.

An authorized manager can:

- Approve fully
- Approve partially (with different quantities per item)
- Reject entirely

**Example of partial approval:**

```
Requested:        Approved:
A = 100           A = 100
B = 50            B = 20
C = 20            C = 0
```

- Rejection of an entire request requires a recorded reason.
- Rejection or reduction of a specific item requires a reason for that item.
- **Approving a supply request does not affect inventory.**

---

## 23. Supply Request Cancellation

- Supply requests can be cancelled based on their status and the user's permissions.
- After rejection, the request is not modified to re-include rejected items.
- A **new supply request** must be created instead.

---

## 24. Shipments

After a supply request is approved, a shipment can be created.

- The shipment specifies what will actually be sent.
- Sent quantity must not exceed the approved quantity: `Sent Quantity <= Approved Quantity`
- Multiple shipments can be created for the same supply request.

**Example:**

```
Approved     = 100
Shipment 1   = 70
Shipment 2   = 30
```

**Shipment data includes:**

| Field |
|---|
| Items and Sent Quantities |
| Batches |
| Sender |
| Sending Timestamp |

---

## 25. Sending a Shipment

- Approving/creating a shipment does not mean it has been sent.
- A **separate send action** must be executed.

Upon sending:

```
Source Inventory --> Stock Out
```

The system records:

- The user who sent the shipment
- Timestamp
- Quantities and batches

---

## 26. Receiving a Shipment

- The receiving entity must confirm receipt.
- The received quantity may be **less than the sent quantity**.

**Example:**

```
Sent     = 100
Received = 90
Shortage = 10 (recorded)
```

Upon confirmation:

```
Destination Inventory --> Stock In
```

**Shipment statuses:**

| Status |
|---|
| Prepared |
| Sent |
| Partially Received |
| Received |

---

## 27. Suppliers

The system supports supplier management. Any warehouse can purchase from any supplier.

Supported operations:

- Create supplier
- Edit supplier
- Deactivate supplier
- Record purchases from supplier
- Record returns to supplier

---

## 28. Purchase Workflow

Purchases flow from a supplier to a warehouse.

```
Purchase Request
       |
       v
    Approval
       |
       v
 Purchase Order
       |
       v
    Supplier
       |
       v
    Receiving
       |
       v
Purchase Invoice
       |
       v
Inventory Update
```

- A warehouse **employee** can create a purchase request; it requires manager approval.
- A warehouse **manager** can create and self-approve a purchase request without a separate approval step.

---

## 29. Purchase Receiving

When products are received from a supplier, the following must be recorded:

1. Products received
2. Quantities
3. Batches
4. Expiry dates
5. Purchase cost
6. Warehouse inventory update
7. Stock In movement
8. Link to the purchase operation

A single drug in a purchase can have multiple batches.

---

## 30. Purchase Invoice

**Invoice data includes:**

| Field |
|---|
| Invoice Number |
| Supplier |
| Warehouse |
| Items and Quantities |
| Purchase Prices |
| Batches |
| Total |
| Date |
| User |

---

## 31. Batch Correction

- Completed batch or receipt data is **not directly modified**.
- Errors are corrected via a documented **Correction** or **Inventory Adjustment**.

**Example:**

```
Original : Expiry = 2027-06-01
Corrected: Expiry = 2027-08-01
```

- The correction is recorded in the Audit Log.
- Historical movement records are preserved; no data is lost.

---

## 32. Sales

Sales are made from a **pharmacy to a customer**. Warehouses do not sell directly to customers.

**Each invoice item contains:**

| Field |
|---|
| Drug |
| Batch |
| Quantity |
| Selling Price Snapshot |
| Discount (if applicable) |

---

## 33. Customer Information

- Customer data is **optional** for regular sales.
- For sensitive drugs, the following may be recorded:
  - Customer Name
  - Customer National ID
- Customers are **not users** of the system.

---

## 34. Sales Invoice

Every sales invoice must have a **unique invoice number**.

**Invoice data includes:**

| Field |
|---|
| Invoice Number |
| Pharmacy |
| User |
| Date / Time |
| Items, Quantities, Batches |
| Selling Price (snapshot) |
| Discount |
| Payment Method |
| Total |

- The selling price is captured as a snapshot at the time of sale.
- **Price changes do not affect past invoices.**
- **Sales invoices cannot be edited after issuance.**

---

## 35. Selling Prices

- Each drug has one current selling price.
- The selling price is uniform across all pharmacies (no per-pharmacy pricing at this stage).
- Price changes can be made by: **Pharmacy Manager**, **Pharmacy Admin**, or **System Admin**.
- **Price history is maintained.**

**Example:**

```
Price History:
10.00 --> effective 2026-07-01
12.00 --> effective 2026-08-01
```

---

## 36. Discounts

The system supports:

- Percentage discount
- Fixed amount discount

Discount application is subject to user permissions.

---

## 37. Payment Methods

- The system **records the payment method only**.
- The system does **not** process payments or integrate with a payment gateway.
- System Admin can manage available payment methods.

---

## 38. Sales Inventory Update

Upon a successful sale:

```
Sales Invoice --> Stock Out --> Pharmacy Inventory
```

- Invoice creation and inventory deduction must be **atomic**.
- If stock is insufficient, the sale is rejected. No partially completed sale that results in negative stock is permitted.

---

## 39. Customer Returns

- A customer can return products to a pharmacy.
- The return **must be linked to a prior sales invoice** from the same pharmacy.
- **Independent returns (not linked to a sales invoice) are not permitted.**

Upon acceptance:

```
Customer Return --> Pharmacy Inventory --> Stock In
```

A stock movement is recorded.

---

## 40. Pharmacy Returns

A pharmacy can return products to its primary warehouse.

```
Pharmacy --> Primary Warehouse
```

- Only products originally received from that warehouse can be returned.

Recorded data includes:

- Return record
- Batch and quantity
- Stock Out from pharmacy
- Stock In for warehouse upon receipt

---

## 41. Supplier Returns

A warehouse can return products to a supplier.

- The product must have been previously purchased from that supplier.

```
Warehouse --> Supplier --> Stock Out
```

---

## 42. Drug Destruction

The system supports drug destruction.

**Recorded data includes:**

| Field |
|---|
| Drug |
| Batch |
| Quantity |
| Location |
| User |
| Timestamp |
| Reason |

- Quantity is deducted from inventory.
- A Stock Movement and Audit Log are created.

---

## 43. Low Stock Alerts

Each drug in a location can have a configurable **alert threshold**.

When current stock reaches or falls below the threshold:

```
Current Stock <= Alert Threshold --> Notification Created
```

**For warehouses:**
- In-App Notification
- SMS to Warehouse Manager

**For pharmacies:**
- In-App Notification
- SMS / Notification to Pharmacy Manager

System Admin and Pharmacy Admin also have access to all alerts for their linked entities.

---

## 44. Expiry Alerts

The system monitors batch expiry dates.

- A system-wide configurable lead time triggers a **Near Expiry Notification**.
- Upon actual expiry: an **Expired Notification** is generated.
- All notifications are stored within the system.

---

## 45. Notifications

**Supported notification types:**
- In-App Notifications
- SMS Notifications

**Notification requirements:**

- Must be linked to the target user.
- Must support **Unread** and **Read** states.

**Triggered by events such as:**

- Low Stock
- Near Expiry
- Expired Drug
- Supply Request updates
- Shipment updates
- Purchase Request updates
- Other operations based on user permissions

> The SMS provider must be **replaceable without modifying business logic** (abstracted via an interface/adapter).

---

## 46. Audit Logs

The system maintains audit logs for all important operations.

**Operations logged include:**

- Drugs, Inventory, Prices
- Users, Permissions
- Sales, Purchases
- Supply Requests, Shipments
- Returns, Destruction
- Settings

**Minimum fields per log entry:**

| Field |
|---|
| User |
| Action |
| Timestamp |

- Audit logs are **immutable** (cannot be edited or deleted via the system).
- Logs are **retained for 3 months**, then automatically purged.

---

## 47. Reports

The system provides reports covering:

- Sales
- Inventory
- Stock Movements
- Best-Selling Drugs
- Near-Expiry Drugs
- Expired Drugs
- Purchases

**Available filters:**

| Filter |
|---|
| Date Range |
| Pharmacy |
| Warehouse |
| Drug |
| Category |
| Supplier |
| User |

Reports can support export to **Excel / PDF**.

---

## 48. Use Cases

### UC-01: Login

**Actor:** User

1. User enters credentials.
2. System validates credentials.
3. System checks account status.
4. System issues Access Token and Refresh Token.
5. User accesses the system according to their permissions.

---

### UC-02: Create User

**Actor:** System Admin / Pharmacy Admin

1. Enter user data.
2. Assign a role.
3. Define scope / location(s).
4. Save the user.

---

### UC-03: Create Drug

**Actor:** System Admin / Pharmacy Admin

1. Enter drug data.
2. Assign active ingredients.
3. Assign category.
4. Assign manufacturer.
5. Save the product.

---

### UC-04: Search Alternative Drugs

**Actor:** Pharmacist / Authorized Employee

1. Search by active ingredient.
2. System retrieves linked drugs.
3. System displays results.

---

### UC-05: Create Supply Request

**Actor:** Pharmacy Employee / Pharmacy Manager / Warehouse Employee / Warehouse Manager

1. Select the supply source.
2. Select drugs.
3. Enter quantities.
4. Submit the request.
5. Status becomes **Pending Approval**.

---

### UC-06: Approve Supply Request

**Actor:** Warehouse Manager / Pharmacy Manager / Pharmacy Admin / System Admin

1. Open the request.
2. Review items.
3. Set approved quantity for each item.
4. Record reasons for rejections or quantity changes.
5. Approve the request.

> Inventory is NOT modified at this step.

---

### UC-07: Reject Supply Request

**Actor:** Warehouse Manager / Pharmacy Manager / Pharmacy Admin / System Admin

1. Open the request.
2. Reject the request.
3. Record reason.
4. Update status.
5. Generate notification.

---

### UC-08: Create Shipment

**Actor:** Warehouse Employee / Warehouse Manager

1. Select an approved supply request.
2. Select items.
3. Define sent quantities.
4. Assign batches.
5. Create the shipment.

---

### UC-09: Send Shipment

**Actor:** Warehouse Employee / Warehouse Manager

1. Review shipment.
2. Execute the send action.
3. Record user and timestamp.
4. Record Stock Out.
5. Update status to **Sent**.

---

### UC-10: Receive Shipment

**Actor:** Pharmacy Employee / Pharmacy Manager / Warehouse Employee / Warehouse Manager (at the destination)

1. Open the shipment.
2. Enter received quantities.
3. Confirm receipt.
4. Record Stock In.
5. Record shortage if received quantity is less than sent.

---

### UC-11: Create Purchase Request

**Actor:** Warehouse Employee / Manager

1. Select supplier.
2. Select items.
3. Define quantities.
4. Create purchase request.

---

### UC-12: Approve Purchase Request

**Actor:** Warehouse Manager

1. Review the request.
2. Approve it.
3. Generate Purchase Order.

> If the creator is the Warehouse Manager themselves, approval is automatic.

---

### UC-13: Receive Purchase

**Actor:** Warehouse Employee / Manager

1. Record received products.
2. Register batches.
3. Record expiry dates.
4. Record purchase cost.
5. Update inventory.
6. Record Stock In.

---

### UC-14: Create Sales Invoice

**Actor:** Pharmacist / Authorized Employee

1. Add items.
2. Enter quantities.
3. System selects batch by earliest expiry (FEFO).
4. User may change batch if authorized.
5. Capture selling price snapshot.
6. Apply discount if applicable.
7. Select payment method.
8. Enter customer information if required.
9. Calculate total.
10. Create invoice.
11. Record Stock Out.

---

### UC-15: Customer Return

**Actor:** Pharmacist / Pharmacy Employee / Pharmacy Manager

1. Identify the original sales invoice.
2. Select items to return.
3. Enter quantities.
4. Create return.
5. Record Stock In.

---

### UC-16: Pharmacy Return

**Actor:** Pharmacy Employee / Pharmacy Manager

1. Select products.
2. Select batches.
3. Define quantities.
4. Create return.
5. Record Stock Out from pharmacy.
6. Record Stock In for warehouse upon receipt.

---

### UC-17: Supplier Return

**Actor:** Warehouse Employee / Warehouse Manager

1. Select supplier.
2. Select products.
3. Select batches.
4. Define quantities.
5. Execute return.
6. Record Stock Out.

---

### UC-18: Destroy Drugs

**Actor:** Pharmacy Employee / Pharmacy Manager / Warehouse Employee / Warehouse Manager

1. Select drug.
2. Select batch.
3. Enter quantity.
4. Record reason.
5. Execute destruction.
6. Record Stock Out.
7. Create Audit Log.

---

### UC-19: Adjust Inventory

**Actor:** Pharmacy Manager / Warehouse Manager / Pharmacy Admin / System Admin

1. Select location.
2. Select drug and batch.
3. Define adjustment amount.
4. Enter reason.
5. Execute adjustment.
6. Record Stock Movement.
7. Create Audit Log.

---

### UC-20: Monitor Low Stock

**Actor:** System (automated)

1. Check inventory levels.
2. Compare current stock against threshold.
3. Create notification.
4. Send SMS to appropriate manager.

---

### UC-21: Monitor Expiry

**Actor:** System (automated)

1. Check expiry dates.
2. Identify near-expiry batches.
3. Create Near Expiry notification.
4. Upon expiry, create Expired notification.

---

### UC-22: Update Selling Price

**Actor:** Pharmacy Manager / Pharmacy Admin / System Admin

1. Select drug.
2. Enter new price.
3. Save current price.
4. Record in price history.
5. Create Audit Log.

---

### UC-23: View Reports

**Actor:** Pharmacy Manager / Warehouse Manager / Pharmacy Admin / System Admin

1. Select report type.
2. Apply filters.
3. Execute query / aggregation.
4. View results.

---

## 49. Workflows

### Supply Request Workflow

```
Create Request
       |
       v
Pending Approval
       |
   +---+---+
   |       |
Rejected  Approved (Full / Partial)
               |
               v
       Create Shipment
               |
               v
           Prepared
               |
               v
             Sent
               |
               v
       Pending Receipt
               |
         +-----+-----+
         |           |
      Received   Partially Received
```

**Key rules:**

| Rule |
|---|
| Approval does NOT change inventory |
| Shipment Send = Source Stock Out |
| Shipment Receive = Destination Stock In |

---

### Purchase Workflow

```
Purchase Request
       |
       v
Pending Approval
       |
       v
    Approved
       |
       v
 Purchase Order
       |
       v
    Supplier
       |
       v
    Receiving
       |
       v
Batch Registration
       |
       v
Purchase Invoice
       |
       v
Warehouse Inventory
       |
       v
    Stock In
```

---

### Sales Workflow

```
Create Sale
    |
    v
Select Products
    |
    v
Select Batch (FEFO)
    |
    v
Calculate Discount
    |
    v
Calculate Total
    |
    v
Create Invoice
    |
    v
  Stock Out
    |
    v
 Completed
```

---

### Return Workflows

**Customer Return:**

```
Sales Invoice --> Customer Return --> Pharmacy Inventory --> Stock In
```

**Pharmacy Return:**

```
Pharmacy --> Stock Out --> Primary Warehouse --> Stock In
```

**Supplier Return:**

```
Warehouse --> Stock Out --> Original Supplier
```

---

## 50. Domain Entities

The initial domain model includes the following entities:

> Note: This is a domain model, **not** a final MongoDB schema. Embedding vs. referencing decisions will be made during the architecture phase based on access patterns, performance, and concurrency requirements.

| Entity |
|---|
| User |
| Permission |
| Pharmacy |
| Warehouse |
| Drug |
| ActiveIngredient |
| Category |
| Manufacturer |
| Batch |
| Inventory |
| StockMovement |
| Supplier |
| SupplyRequest |
| SupplyRequestItem |
| Shipment |
| ShipmentItem |
| PurchaseRequest |
| PurchaseRequestItem |
| PurchaseOrder |
| PurchaseOrderItem |
| PurchaseReceipt |
| PurchaseReceiptItem |
| PurchaseInvoice |
| SalesInvoice |
| SalesInvoiceItem |
| Customer |
| CustomerReturn |
| CustomerReturnItem |
| PharmacyReturn |
| PharmacyReturnItem |
| SupplierReturn |
| SupplierReturnItem |
| Destruction |
| InventoryAdjustment |
| Notification |
| AuditLog |
| PaymentMethod |
| PriceHistory |

> **Note on Roles:** Roles are **fixed and predefined** by the system (see Section 3). Role is not a configurable domain entity — no custom roles can be created, modified, or deleted. Role logic is hardcoded in the permission layer.

---

## 51. REST API Requirements

APIs must be organized by domain and must use versioning.

**Base path structure:**

```
/api/v1/auth
/api/v1/users
/api/v1/permissions
/api/v1/pharmacies
/api/v1/warehouses
/api/v1/drugs
/api/v1/active-ingredients
/api/v1/categories
/api/v1/manufacturers
/api/v1/batches
/api/v1/inventory
/api/v1/stock-movements
/api/v1/supply-requests
/api/v1/shipments
/api/v1/suppliers
/api/v1/purchase-requests
/api/v1/purchase-orders
/api/v1/purchase-receipts
/api/v1/purchase-invoices
/api/v1/sales-invoices
/api/v1/customer-returns
/api/v1/pharmacy-returns
/api/v1/supplier-returns
/api/v1/destructions
/api/v1/inventory-adjustments
/api/v1/notifications
/api/v1/audit-logs
/api/v1/reports
```

Each sensitive API endpoint must handle:

- Authentication
- Authorization
- Input validation
- Business rule enforcement
- Error handling
- Audit logging

List endpoints must support **pagination** where needed.

---

## 52. Backend Architecture Requirements

The backend must enforce separation of concerns.

**Layer structure:**

```
Routes
   |
   v
Controllers
   |
   v
Services
   |
   v
Repositories / Data Access
   |
   v
MongoDB
```

- Controllers must **not** contain complex business logic.
- Core business rules must reside in the **Services / Domain Logic** layer.
- Additional layers or components may be introduced as needed.

---

## 53. MongoDB Requirements

Schema design must be driven by:

- Access patterns
- Query frequency
- Data relationships
- Data integrity
- Transaction requirements
- Concurrency concerns
- Scalability

**Required indexes** (examples):

| Field |
|---|
| Barcode |
| Drug Name |
| Active Ingredient |
| Batch Number |
| Expiry Date |
| Location |
| Invoice Number |
| Supply Request Status |
| Notification Status |
| Audit Log Timestamp |

- **Current inventory must be fast to query.** It must not be recalculated by aggregating all historical stock movements on every request.
- **Stock movements remain as a complete historical record.**

---

## 54. Transactions and Data Integrity

Critical operations must maintain **atomicity**.

**Operations requiring atomicity:**

- Sales
- Purchase Receiving
- Shipment Sending
- Shipment Receiving
- Returns
- Inventory Adjustments

MongoDB transactions must be used where needed to prevent partial execution scenarios.

**Sale operation example (must be fully atomic):**

```
Create Invoice
      +
Decrease Inventory
      +
Create Stock Movement
      +
Audit Log
```

A partial success that results in inconsistent data is not acceptable.

---

## 55. Security Requirements

The system must implement:

- Authentication
- Authorization
- Role-Based Access Control (RBAC)
- Permission-based access control
- Resource-level authorization
- Input validation
- Password hashing
- Secure token handling
- Refresh token security
- Rate limiting
- Secure error handling
- Audit logging
- Protection against unauthorized cross-branch access
- Protection against unauthorized inventory operations

---

## 56. Testing Requirements

Tests must cover all critical operations:

- Authentication and Authorization
- Inventory operations
- Sales and Purchases
- Supply Requests and Shipments
- Receiving
- Returns
- Destruction
- Inventory Adjustments
- Pricing
- Notifications

**Edge cases to test:**

| Edge Case |
|---|
| Insufficient Stock |
| Negative Stock |
| Concurrent Sales |
| Concurrent Inventory Updates |
| Partial Approval |
| Partial Shipment |
| Partial Receiving |
| Duplicate Invoice Number |
| Invalid Batch |
| Expired Batch |
| Unauthorized Access |
| Cross-Pharmacy Access |
| Cross-Warehouse Access |
| Invalid Return |
| Pharmacy Admin cross-entity access violation |

---

## 57. Non-Functional Requirements

| Quality Attribute | Requirement |
|---|---|
| **Security** | The system must protect sensitive data and operations from unauthorized access. |
| **Scalability** | The system must support adding new pharmacies, warehouses, users, and operations without fundamental architectural changes. |
| **Performance** | Frequent operations such as inventory lookup and drug search must be supported by appropriate indexes. |
| **Reliability** | Critical operations must never result in partial or inconsistent data states. |
| **Maintainability** | Code must be modular and extensible. |
| **Auditability** | All important operations must be traceable. |
| **Availability** | The system must be designed to run in a production environment with support for health checks, monitoring, and logging. |
| **Data Retention** | Audit logs are retained for 3 months and then automatically deleted. |

---

## 58. Business Rules Summary

| # | Rule |
|---|---|
| 1 | Each pharmacy is linked to exactly one primary warehouse. |
| 2 | A warehouse can serve multiple pharmacies. |
| 3 | A warehouse can supply another warehouse. |
| 4 | A warehouse can supply drugs it received from another warehouse. |
| 5 | Users are subject to their role, permissions, and resource scope. |
| 6 | System roles are fixed and predefined; no custom roles can be created, modified, or deleted. |
| 7 | A Pharmacy Manager can also be a Pharmacy Employee / Pharmacist. |
| 8 | A Warehouse Manager can also be a Warehouse Employee. |
| 9 | A manager can manage multiple locations of the same type without merging entities. |
| 10 | A Pharmacy Admin holds combined Pharmacy Manager and Warehouse Manager permissions for all their linked entities. |
| 11 | A Pharmacy Admin can be linked to multiple pharmacies and multiple warehouses. |
| 12 | A Pharmacy Admin cannot access pharmacies or warehouses not linked to their account. |
| 13 | Drug entities are separate from Active Ingredient entities. |
| 14 | A drug can have more than one active ingredient. |
| 15 | Inventory is independent per pharmacy and warehouse. |
| 16 | Inventory is tracked at the batch level. |
| 17 | The system defaults to FEFO batch selection (earliest expiry first). |
| 18 | Authorized users can override the default batch selection. |
| 19 | The system allows expired batches to exist, be sold, and be received. |
| 20 | A supply request or sale may be submitted for a quantity exceeding available stock, but the actual execution (fulfillment, shipment send, sale) will be rejected if it would result in negative stock. |
| 21 | Every stock change must be traceable. |
| 22 | Supply requests start with status: Pending Approval. |
| 23 | Supply requests can be fully or partially approved. |
| 24 | Entire request rejection requires a recorded reason. |
| 25 | Item-level rejection or quantity reduction requires a recorded reason. |
| 26 | Approval does not change inventory. |
| 27 | Shipment quantity can be less than approved, but cannot exceed it. |
| 28 | Multiple shipments can be created for one supply request. |
| 29 | Shipment creation is not the same as shipment sending. |
| 30 | Sending a shipment results in Stock Out from source. |
| 31 | Receiving a shipment results in Stock In at destination. |
| 32 | Received quantity can be less than sent quantity. |
| 33 | Partial receiving is allowed. |
| 34 | Purchases flow from Supplier to Warehouse only. |
| 35 | Purchase requests created by employees require manager approval. |
| 36 | Warehouse Managers can self-approve purchase requests they create. |
| 37 | Purchase cost is saved with the batch / receipt. |
| 38 | Customer sales occur from pharmacies only. |
| 39 | Customer returns must be linked to a sales invoice from the same pharmacy. |
| 40 | Pharmacy returns go to the primary warehouse only. |
| 41 | Supplier returns go to the original supplier. |
| 42 | Sales invoice numbers must be unique. |
| 43 | Sales invoices cannot be edited after issuance. |
| 44 | Selling price is captured as a snapshot in the sales invoice. |
| 45 | Price changes do not affect past invoices. |
| 46 | Selling price can be changed by Pharmacy Manager, Pharmacy Admin, or System Admin. |
| 47 | Price history is maintained. |
| 48 | The system records payment method only and does not process payments. |
| 49 | Destruction results in Stock Out. |
| 50 | Inventory adjustments require a mandatory reason. |
| 51 | Completed batch / receipt data is not directly modified. |
| 52 | Corrections are made through documented adjustments. |
| 53 | Audit logs are immutable and cannot be edited or deleted via the system. |
| 54 | Audit logs are retained for 3 months. |
| 55 | Low stock triggers In-App Notification and SMS to the responsible manager. |
| 56 | Expiry notifications cover both Near Expiry and Expired states. |
| 57 | Notifications are stored within the system. |
| 58 | Authentication uses Access Token and Refresh Token. |
| 59 | The SMS provider must be replaceable without modifying business logic. |
| 60 | All security decisions are enforced on the backend. |
| 61 | Critical operations must maintain atomicity and data integrity. |
| 62 | The system is production-oriented, not a prototype. |

---

## 59. Out of Scope

The following are explicitly **outside** the current system scope:

- Patients as direct system users
- Electronic payment processing or payment gateway integration
- Direct warehouse-to-customer sales
- A full cashiering or financial accounting module
- Patient diagnosis
- Prescription management as a standalone module (may be added later)
- Integration with a specific SMS provider at this stage

---

## 60. Open Technical Decisions

Business requirements are finalized. The following technical decisions will be made during the architecture phase based on system requirements:

| Area | Decision Needed |
|---|---|
| JWT Token Strategy | Token format, signing, expiry |
| Refresh Token Rotation | Rotation policy and storage |
| MongoDB Schema Strategy | Embedding vs. referencing per entity |
| Transaction Boundaries | Scope and granularity |
| Index Strategy | Fields and index types per collection |
| Concurrency Control | Optimistic vs. pessimistic locking |
| API Error Format | Standard error response structure |
| Pagination Strategy | Cursor-based vs. offset-based |
| Logging Architecture | Structured logging, log levels, storage |
| Notification Processing | Synchronous vs. queue-based |
| SMS Provider Integration | Adapter / abstraction layer design |
| Background Jobs | Job runner choice (cron, queue workers) |
| Deployment Architecture | Containerization, orchestration |
| Monitoring | Metrics, alerting, dashboards |

---

*End of Software Requirements Specification*
