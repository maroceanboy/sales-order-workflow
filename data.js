const NODES = [
  {
    num: "1", kind: "stage",
    dept: "sales", deptName: "Sales Department",
    title: "Order Received",
    who: "Sales Representative / Customer Service Coordinator",
    tasks: [
      "Receive the customer purchase order (email, phone, or web portal).",
      "Verify customer details, products, quantities, pricing, and stock availability.",
      "Enter the order into the system and confirm receipt with the customer."
    ],
    outcomes: [
      { when: "Order complete and accurate", then: "Order is passed to Credit & Finance for approval." },
      { when: "Missing or unclear details", then: "Raise a customer query; the order is held until the customer clarifies — nothing moves downstream in the meantime." }
    ]
  },
  {
    num: "2", kind: "stage",
    dept: "finance", deptName: "Finance Department",
    title: "Credit Check & Approval",
    who: "Accounts Receivable Clerk, reviewed by Finance Manager",
    tasks: [
      "Run a credit check against the customer's credit limit and payment history.",
      "Confirm payment terms (prepay, net 30, etc.).",
      "Approve the order for fulfilment — or place it on credit hold."
    ],
    outcomes: [
      { when: "Within credit limit", then: "Order is released to the Warehouse as a pick list." },
      { when: "Over limit or poor payment history", then: "Order goes to the Credit Hold path." }
    ]
  },
  {
    num: "2a", kind: "branch",
    dept: "finance", deptName: "Finance Department",
    title: "Credit Hold Path",
    who: "Finance Manager, together with the Sales Representative",
    tasks: [
      "Notify the customer and the sales representative, and record the hold reason in the system.",
      "Agree a way forward with the customer.",
      "Release the order only with an approved resolution."
    ],
    outcomes: [
      { when: "Customer pays a deposit or prepays", then: "Order is released and picking can start." },
      { when: "Order is reduced to fit within the limit", then: "New amounts are re-entered and the order is released." },
      { when: "Finance Manager approves an override with justification", then: "Order is released, flagged for follow-up." },
      { when: "No resolution", then: "Order is rejected or stays on hold — no product ships while a hold is active." }
    ]
  },
  {
    num: "3", kind: "stage",
    dept: "warehouse", deptName: "Warehouse Department",
    title: "Stock Picking",
    who: "Warehouse Picker, supervised by Warehouse Supervisor",
    tasks: [
      "Receive the pick list generated from the approved order.",
      "Pick the items from shelves and record batch/serial numbers.",
      "Count-check picked items against the order."
    ],
    outcomes: [
      { when: "All items in stock", then: "Picked goods move to packaging / quality control." },
      { when: "Shortage or damaged stock found", then: "Go to the Shortage & Backorder path." }
    ]
  },
  {
    num: "3a", kind: "branch",
    dept: "warehouse", deptName: "Warehouse + Purchasing + Sales",
    title: "Shortage & Backorder",
    who: "Warehouse Supervisor with Purchasing and the Sales Representative",
    tasks: [
      "Check incoming replenishment dates with Purchasing.",
      "Check whether a suitable alternative product exists.",
      "Agree the resolution with the customer before changing anything."
    ],
    outcomes: [
      { when: "Partial stock", then: "Ship what is available; put the remainder on backorder and confirm the new delivery date with the customer." },
      { when: "Alternative product accepted by the customer", then: "Pick list is updated with the substitute and the order proceeds." },
      { when: "Customer prefers to wait", then: "Order is held until replenishment arrives; Purchasing prioritizes the shortage." },
      { when: "Customer cancels the short line(s)", then: "Confirm the cancellation in writing and continue with the remaining lines." }
    ]
  },
  {
    num: "4", kind: "stage",
    dept: "production", deptName: "Production / Assembly",
    title: "Packaging & Quality Check",
    who: "Packer, with Quality Control Inspector",
    tasks: [
      "Pack goods for safe transport, label packages per order.",
      "Quality Control performs the final inspection and sign-off.",
      "Attach packing slip and any required certificates."
    ],
    outcomes: [
      { when: "Inspection passed", then: "Packed order is handed to Logistics for dispatch." },
      { when: "Item fails inspection or is damaged", then: "Re-source the item from stock (new pick) and repeat the check; the faulty item is quarantined for the supplier or disposal." }
    ]
  },
  {
    num: "5", kind: "stage",
    dept: "logistics", deptName: "Logistics Department",
    title: "Shipping & Delivery Confirmation",
    who: "Shipping Clerk, coordinated by Logistics Manager",
    tasks: [
      "Book transport / courier and prepare shipping documents (waybill, customs if needed).",
      "Load goods, record shipment details, and send tracking information via Sales to the customer.",
      "Confirm delivery and capture proof of delivery (signed note or electronic confirmation)."
    ],
    outcomes: [
      { when: "Delivered, proof of delivery received", then: "Order moves to Billing — only shipped quantities are invoiced." },
      { when: "Damaged or lost in transit", then: "Go to the Transit Damage Claim path." },
      { when: "Customer reports a problem after delivery", then: "Go to the Returns / RMA path." }
    ]
  },
  {
    num: "5a", kind: "branch",
    dept: "logistics", deptName: "Logistics Department",
    title: "Transit Damage Claim",
    who: "Logistics Manager, with the carrier and Quality Control",
    tasks: [
      "Photograph and document the damage; notify the carrier within the claim deadline.",
      "File the carrier claim and keep the customer informed.",
      "Agree with the customer: replacement or credit."
    ],
    outcomes: [
      { when: "Replacement agreed", then: "A replacement order line is raised and re-enters the workflow at Stock Picking; the damaged goods are returned or scrapped per the carrier's instructions." },
      { when: "Credit agreed", then: "Finance issues a credit memo once the carrier claim is settled and the order continues to Billing for the undamaged lines." }
    ]
  },
  {
    num: "5b", kind: "branch",
    dept: "sales", deptName: "Sales + Warehouse + Finance",
    title: "Returns / RMA",
    who: "Customer Service Coordinator, with Warehouse and Finance",
    tasks: [
      "Authorize the return (RMA number) — only returns with authorization are accepted.",
      "Receive and inspect the returned goods on arrival.",
      "Decide the disposition: restock, scrap, or return to supplier."
    ],
    outcomes: [
      { when: "Return valid, goods resellable", then: "Goods are restocked and Finance issues a credit memo against the original invoice." },
      { when: "Return valid, goods not resellable", then: "Goods are scrapped or returned to the supplier; Finance issues the credit memo and the loss is recorded." },
      { when: "Return invalid (e.g. outside return window, customer damage)", then: "Request declined with written explanation; the invoice stands." },
      { when: "Faulty batch suspected", then: "Serial/batch records from Stock Picking are used to trace and recall other affected orders." }
    ]
  },
  {
    num: "6", kind: "stage",
    dept: "finance", deptName: "Finance Department",
    title: "Invoicing & Payment",
    who: "Billing Clerk / Accounts Receivable",
    tasks: [
      "Issue the final invoice based on the shipped quantities and agreed terms.",
      "Monitor payment until it arrives and clear any questions the customer raises about the invoice.",
      "Match received payment to the invoice (cash application)."
    ],
    outcomes: [
      { when: "Paid on time", then: "Payment is applied to the invoice and the order moves to Order Closure." },
      { when: "Payment overdue", then: "Go to the Collections & Dunning path." }
    ]
  },
  {
    num: "6a", kind: "branch",
    dept: "finance", deptName: "Finance Department",
    title: "Collections & Dunning",
    who: "Accounts Receivable Clerk, escalated to Finance Manager",
    tasks: [
      "Send payment reminders on a fixed dunning schedule (e.g. 7, 14, 30 days overdue).",
      "Call the customer and agree a payment date if reminders are unanswered.",
      "Escalate persistent non-payers."
    ],
    outcomes: [
      { when: "Customer pays after reminders", then: "Payment is applied, the account returns to normal terms, and the order moves to Order Closure." },
      { when: "Still unpaid after escalation", then: "The account is blocked: new orders are auto-held at Credit Check until the balance is settled." },
      { when: "Formal collection or write-off", then: "Handled per company policy; the outcome is recorded on the customer record for future credit decisions." }
    ]
  },
  {
    num: "7", kind: "stage",
    dept: "finance", deptName: "Finance Department",
    title: "Order Closure",
    who: "Billing Clerk / Accounts Receivable, reviewed by Finance Manager",
    tasks: [
      "Reconcile the order in the books: every line shipped, invoiced, and paid.",
      "Resolve any remaining adjustments (credit memos, discounts, claims) before filing.",
      "Mark the order complete, archive the records (order, invoice, proof of delivery, RMA papers), and record the cycle time for the KPI report."
    ],
    outcomes: [
      { when: "Everything settled", then: "Order is marked complete and archived. Order closed." },
      { when: "Adjustments still pending", then: "Closure waits until each one is resolved — orders are never archived with open amounts." }
    ]
  }
];
