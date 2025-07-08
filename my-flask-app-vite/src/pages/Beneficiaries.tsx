import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { UserPlus, Trash2, Edit2 } from "lucide-react";

const RELATIONSHIPS = [
  { label: "Spouse", color: "bg-pink-100 text-pink-700" },
  { label: "Child", color: "bg-yellow-100 text-yellow-700" },
  { label: "Parent", color: "bg-green-100 text-green-700" },
  { label: "Sibling", color: "bg-blue-100 text-blue-700" },
  { label: "Friend", color: "bg-purple-100 text-purple-700" },
  { label: "Other", color: "bg-gray-100 text-gray-700" },
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const getRelationshipColor = (relationship) =>
  RELATIONSHIPS.find((r) => r.label === relationship)?.color || "bg-gray-100 text-gray-700";

const Beneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beneficiaries", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBeneficiaries(data);
    } catch {
      toast.error("Could not load beneficiaries.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleDelete = async (id) => {
    await fetch(`/api/beneficiaries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    toast.success("Beneficiary removed");
    setConfirmDelete(null);
    fetchBeneficiaries();
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Beneficiaries
          </h1>
          <p className="text-gray-500 mt-2 text-center max-w-lg">
            Manage your beneficiaries below. Add loved ones to ensure your benefits reach the right people.
          </p>
          <button
            className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <UserPlus className="inline w-5 h-5 mr-2" />
            Add Beneficiary
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl h-28" />
            ))}
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <UserPlus className="w-16 h-16 mb-4 text-blue-400" />
            <div className="mb-2 text-xl font-semibold">No beneficiaries yet</div>
            <div className="mb-6 text-base text-gray-500">
              Add your first beneficiary to ensure your loved ones are protected.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {beneficiaries.map((b) => (
              <div
                key={b.id}
                className="relative bg-white rounded-2xl shadow-xl p-6 flex items-center gap-4 border-l-8 border-blue-400 hover:shadow-2xl transition"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border-4 border-white">
                    {getInitials(b.name)}
                  </div>
                </div>
                <div className="flex-1 ml-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xl">{b.name}</span>
                    {b.relationship && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRelationshipColor(b.relationship)}`}>
                        {b.relationship}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 text-sm flex flex-wrap gap-x-4 gap-y-1">
                    <span><span className="font-semibold">ID:</span> {b.id_number || "-"}</span>
                    <span><span className="font-semibold">DOB:</span> {b.date_of_birth || "-"}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {b.phone && <span className="mr-2">📞 {b.phone}</span>}
                    {b.email && <span>✉️ {b.email}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition"
                    onClick={() => { setEditing(b); setShowForm(true); }}
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition"
                    onClick={() => setConfirmDelete(b)}
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Add Button (Mobile) */}
        <button
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg md:hidden"
          onClick={() => { setEditing(null); setShowForm(true); }}
          title="Add Beneficiary"
        >
          <UserPlus className="w-6 h-6" />
        </button>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <BeneficiaryForm
            beneficiary={editing}
            onClose={() => {
              setShowForm(false);
              fetchBeneficiaries();
            }}
          />
        )}

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-8 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4 text-center">
                Remove Beneficiary?
              </h2>
              <div className="mb-6 text-gray-600 text-center">
                Are you sure you want to remove <b>{confirmDelete.name}</b> as a beneficiary?
              </div>
              <div className="flex gap-4">
                <button
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold"
                  onClick={() => handleDelete(confirmDelete.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Add/Edit Beneficiary Form ---
const BeneficiaryForm = ({ beneficiary, onClose }) => {
  const [form, setForm] = useState({
    name: beneficiary?.name || "",
    id_number: beneficiary?.id_number || "",
    relationship: beneficiary?.relationship || "",
    date_of_birth: beneficiary?.date_of_birth || "",
    phone: beneficiary?.phone || "",
    email: beneficiary?.email || "",
  });
  const [loading, setLoading] = useState(false);

  // --- Add these states for document files and URLs ---
  const [idFile, setIdFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [relationshipFile, setRelationshipFile] = useState(null);

  const [idUrl, setIdUrl] = useState(beneficiary?.id_doc_url || "");
  const [addressUrl, setAddressUrl] = useState(beneficiary?.address_doc_url || "");
  const [relationshipUrl, setRelationshipUrl] = useState(beneficiary?.relationship_doc_url || "");

  const isEdit = !!beneficiary;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- Add this helper for uploading a document ---
  const uploadDoc = async (beneficiaryId, file, type, setUrl) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) setUrl(data.url);
  };

  // --- Update handleSubmit to upload documents after saving beneficiary ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit
      ? `/api/beneficiaries/${beneficiary.id}`
      : "/api/beneficiaries";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(isEdit ? "Beneficiary updated" : "Beneficiary added");
      // Save beneficiary first (POST or PUT), get beneficiaryId
      let beneficiaryId = beneficiary?.id;
      if (!beneficiaryId) {
        // Create new beneficiary
        const data = await res.json();
        beneficiaryId = data.id;
      }

      // --- Upload documents if selected ---
      await uploadDoc(beneficiaryId, idFile, "id", setIdUrl);
      await uploadDoc(beneficiaryId, addressFile, "address", setAddressUrl);
      await uploadDoc(beneficiaryId, relationshipFile, "relationship", setRelationshipUrl);

      onClose();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save beneficiary");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl max-w-2xl mx-auto p-8 space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Beneficiary Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div>
            <label className="block font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Relationship</label>
            <select
              name="relationship"
              value={form.relationship}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select...</option>
              {RELATIONSHIPS.map(r => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">ID Number</label>
            <input
              type="text"
              name="id_number"
              value={form.id_number}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Document Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div>
            <label className="block font-medium mb-1">ID Document</label>
            <input type="file" accept="image/*,application/pdf" onChange={e => setIdFile(e.target.files[0])} />
            {idUrl && <a href={idUrl} target="_blank" className="text-blue-600 underline ml-2">View</a>}
          </div>
          <div>
            <label className="block font-medium mb-1">Proof of Address</label>
            <input type="file" accept="image/*,application/pdf" onChange={e => setAddressFile(e.target.files[0])} />
            {addressUrl && <a href={addressUrl} target="_blank" className="text-blue-600 underline ml-2">View</a>}
          </div>
          <div>
            <label className="block font-medium mb-1">Proof of Relationship</label>
            <input type="file" accept="image/*,application/pdf" onChange={e => setRelationshipFile(e.target.files[0])} />
            {relationshipUrl && <a href={relationshipUrl} target="_blank" className="text-blue-600 underline ml-2">View</a>}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Save Beneficiary
          </button>
        </div>
      </form>
    </div>
  );
};

export default Beneficiaries;
