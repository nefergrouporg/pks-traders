const ThermalBillTemplate = ({ billData }: { billData: BillData }) => {
  return (
    <div
      className="thermal-bill"
      style={{
        width: "80mm", // Standard thermal width
        fontFamily: "monospace",
        fontSize: "12px",
        padding: "10px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ textAlign: "center", fontWeight: "bold" }}>YOUR STORE</h2>
      <p style={{ textAlign: "center" }}>{billData.storeInfo.address}</p>
      <hr style={{ borderTop: "1px dashed #000" }} />
      <p>
        <strong>Bill No:</strong> {billData.id}
      </p>
      <p>
        <strong>Date:</strong> {new Date(billData.date).toLocaleString()}
      </p>
      <hr style={{ borderTop: "1px dashed #000" }} />

      {/* Items List */}
      {billData.items.map((item) => (
        <div
          key={item.id}
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <span>
            {item.name} x {item.quantity}
          </span>
          <span>₹{item.total.toFixed(2)}</span>
        </div>
      ))}

      <hr style={{ borderTop: "1px dashed #000" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Total:</strong>
        <strong>₹{billData.total.toFixed(2)}</strong>
      </div>
      <hr style={{ borderTop: "1px dashed #000" }} />
      <p style={{ textAlign: "center" }}>Thank you!</p>
    </div>
  );
};
