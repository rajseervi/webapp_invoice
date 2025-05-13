import React, { useState } from "react";
import PrintableInvoiceDual from "./PrintableInvoiceDual";
import PrintableInvoiceSimple from "./PrintableInvoiceSimple"; // Example: another template

const InvoicePrintWrapper = ({ invoice }) => {
  const [template, setTemplate] = useState("dual");

  return (
    <div>
      <label>
        <input
          type="radio"
          value="dual"
          checked={template === "dual"}
          onChange={() => setTemplate("dual")}
        />
        Dual Copy (Original + Duplicate)
      </label>
      <label>
        <input
          type="radio"
          value="simple"
          checked={template === "simple"}
          onChange={() => setTemplate("simple")}
        />
        Simple Layout
      </label>

      {template === "dual" ? (
        <PrintableInvoiceDual invoice={invoice} />
      ) : (
        <PrintableInvoiceSimple invoice={invoice} />
      )}
    </div>
  );
};

export default InvoicePrintWrapper;