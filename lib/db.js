const { getPool } = require("./pg");
const { STARTING_NUMBERS } = require("./branches");

// Returns "26JUL" style year-month code for a given date (defaults to now).
function yearMonthCode(date = new Date()) {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const yy = String(date.getFullYear()).slice(-2);
  return `${yy}${months[date.getMonth()]}`;
}

// Atomically gets the next invoice number for a branch + month, seeding it
// with the configured starting number the first time that branch/month is used.
async function getNextInvoiceNumber(branchCode) {
  const pool = getPool();
  const ym = yearMonthCode();
  const startingNumber = STARTING_NUMBERS[branchCode] || 1;

  const { rows } = await pool.query(
    `INSERT INTO invoice_counters (branch_code, year_month, last_number)
     VALUES ($1, $2, $3)
     ON CONFLICT (branch_code, year_month)
     DO UPDATE SET last_number = invoice_counters.last_number + 1
     RETURNING last_number;`,
    [branchCode, ym, startingNumber]
  );
  const number = rows[0].last_number;
  const padded = String(number).padStart(5, "0");
  return `${ym}-${branchCode}-${padded}`;
}

async function createInvoice(data) {
  const pool = getPool();
  const {
    branchCode,
    invoiceNo,
    invoiceDate,
    purchaserName,
    purchaserAddress,
    purchaserTp,
    purchaserTin,
    additionalInfo,
    items,
    totalValue,
    discount,
    ssclAmount,
    vatAmount,
    totalAmount,
    amountWords,
    paymentMode,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO invoices
      (branch_code, invoice_no, invoice_date, purchaser_name, purchaser_address,
       purchaser_tp, purchaser_tin, additional_info, items, total_value, discount,
       sscl_amount, vat_amount, total_amount, amount_words, payment_mode)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *;`,
    [
      branchCode, invoiceNo, invoiceDate, purchaserName, purchaserAddress,
      purchaserTp, purchaserTin || "", additionalInfo || "", JSON.stringify(items),
      totalValue, discount, ssclAmount || 0, vatAmount, totalAmount, amountWords, paymentMode,
    ]
  );
  return rows[0];
}

async function getInvoiceById(id) {
  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM invoices WHERE id = $1;`, [id]);
  return rows[0] || null;
}

async function updateInvoice(id, data) {
  const pool = getPool();
  const {
    purchaserName,
    purchaserAddress,
    purchaserTp,
    purchaserTin,
    additionalInfo,
    items,
    totalValue,
    discount,
    ssclAmount,
    vatAmount,
    totalAmount,
    amountWords,
    paymentMode,
  } = data;

  const { rows } = await pool.query(
    `UPDATE invoices SET
       purchaser_name = $1, purchaser_address = $2, purchaser_tp = $3,
       purchaser_tin = $4, additional_info = $5, items = $6, total_value = $7,
       discount = $8, sscl_amount = $9, vat_amount = $10, total_amount = $11,
       amount_words = $12, payment_mode = $13
     WHERE id = $14
     RETURNING *;`,
    [
      purchaserName || "", purchaserAddress || "", purchaserTp || "",
      purchaserTin || "", additionalInfo || "", JSON.stringify(items),
      totalValue, discount, ssclAmount || 0, vatAmount, totalAmount,
      amountWords, paymentMode, id,
    ]
  );
  return rows[0] || null;
}

// Deletes an invoice. If it was the most recently issued number for its
// branch + month (i.e. nothing was generated after it), the counter is
// rolled back by 1 so the next invoice reuses that same number.
// If other invoices came after it, the counter is left untouched — reusing
// a number that sits in the middle of the sequence would create a duplicate.
async function deleteInvoice(id) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: invRows } = await client.query(
      `SELECT * FROM invoices WHERE id = $1 FOR UPDATE;`,
      [id]
    );
    const invoice = invRows[0];
    if (!invoice) {
      await client.query("ROLLBACK");
      return { deleted: false, counterReset: false };
    }

    // invoice_no looks like "26JUL-IDMA-00144"
    const [yearMonth, branchCode, numStr] = invoice.invoice_no.split("-");
    const number = parseInt(numStr, 10);

    await client.query(`DELETE FROM invoices WHERE id = $1;`, [id]);

    let counterReset = false;
    const { rows: counterRows } = await client.query(
      `SELECT last_number FROM invoice_counters WHERE branch_code = $1 AND year_month = $2 FOR UPDATE;`,
      [branchCode, yearMonth]
    );
    if (counterRows[0] && counterRows[0].last_number === number) {
      await client.query(
        `UPDATE invoice_counters SET last_number = last_number - 1
         WHERE branch_code = $1 AND year_month = $2;`,
        [branchCode, yearMonth]
      );
      counterReset = true;
    }

    await client.query("COMMIT");
    return { deleted: true, counterReset };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listInvoices({ branchCode, limit = 50, offset = 0 } = {}) {
  const pool = getPool();
  if (branchCode) {
    const { rows } = await pool.query(
      `SELECT * FROM invoices WHERE branch_code = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3;`,
      [branchCode, limit, offset]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );
  return rows;
}

module.exports = {
  yearMonthCode,
  getNextInvoiceNumber,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  listInvoices,
};
