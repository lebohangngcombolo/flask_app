import React, { useEffect, useState } from "react";

type Beneficiary = {
  id: number;
  name: string;
  account_number: string;
  bank_name: string;
};

const Beneficiaries: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: 0, name: "", account_number: "", bank_name: "" });
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchBeneficiaries();
    // eslint-disable-next-line
  }, []);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    const res = await fetch("http://127.0.0.1:5001/api/beneficiaries", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setBeneficiaries(data);
    setLoading(false);
  };

  const handleAdd = () => {
    setForm({ id: 0, name: "", account_number: "", bank_name: "" });
    setIsEdit(false);
    setShowForm(true);
    setError("");
  };

  const handleEdit = (b: Beneficiary) => {
    setForm(b);
    setIsEdit(true);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this beneficiary?")) return;
    await fetch(`http://127.0.0.1:5001/api/beneficiaries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBeneficiaries();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.account_number || !form.bank_name) {
      setError("All fields are required.");
      return;
    }
    if (isEdit) {
      await fetch(`http://127.0.0.1:5001/api/beneficiaries/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          account_number: form.account_number,
          bank_name: form.bank_name,
        }),
      });
    } else {
      await fetch("http://127.0.0.1:5001/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          account_number: form.account_number,
          bank_name: form.bank_name,
        }),
      });
    }
    setShowForm(false);
    fetchBeneficiaries();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Beneficiaries</h1>
      <button
        onClick={handleAdd}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Beneficiary
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Account Number</th>
              <th className="border px-2 py-1">Bank Name</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map((b) => (
              <tr key={b.id}>
                <td className="border px-2 py-1">{b.name}</td>
                <td className="border px-2 py-1">{b.account_number}</td>
                <td className="border px-2 py-1">{b.bank_name}</td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleEdit(b)}
                    className="mr-2 text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {beneficiaries.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No beneficiaries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              {isEdit ? "Edit Beneficiary" : "Add Beneficiary"}
            </h2>
            {error && (
              <div className="mb-2 text-red-600 text-sm">{error}</div>
            )}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={form.account_number}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1 rounded bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >
                  {isEdit ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;