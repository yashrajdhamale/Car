// import React, { useState, useEffect } from "react";
// import { db } from "../config/firebase";
// import { collection, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";

// const VehicleRateAdmin = () => {
//   const [vehicles, setVehicles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(null);

//   // New vehicle form states
//   const [newName, setNewName] = useState("");
//   const [newNetRate, setNewNetRate] = useState("");
//   const [newMargin, setNewMargin] = useState("");
//   const [newGST, setNewGST] = useState("");

//   useEffect(() => {
//     const fetchRates = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, "vehicles"));
//         const data = snapshot.docs.map((docSnap) => ({
//           id: docSnap.id,
//           ...docSnap.data(),
//         }));
//         setVehicles(data);
//       } catch (error) {
//         console.error("Error fetching vehicles:", error);
//         alert("Failed to load vehicles.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchRates();
//   }, []);

//   const handleChange = (id, field, value) => {
//     setVehicles((prev) =>
//       prev.map((v) =>
//         v.id === id ? { ...v, [field]: Number(value) || 0 } : v
//       )
//     );
//   };

//   const handleSave = async (id) => {
//     const vehicle = vehicles.find((v) => v.id === id);
//     if (!vehicle) return;

//     setSaving(id);

//     const grossRate = (vehicle.netRate + vehicle.margin) * (1 + vehicle.gst / 100);

//     try {
//       await updateDoc(doc(db, "vehicles", id), {
//         netRate: vehicle.netRate,
//         margin: vehicle.margin,
//         gst: vehicle.gst,
//         grossRate,
//       });
//       alert(`Rates for "${vehicle.name}" updated successfully!`);
//     } catch (error) {
//       console.error("Error updating rates:", error);
//       alert("Failed to update rates.");
//     } finally {
//       setSaving(null);
//     }
//   };

//   // New vehicle add handler
//   const handleAddVehicle = async (e) => {
//     e.preventDefault();

//     if (!newName || !newNetRate || !newMargin || !newGST) {
//       alert("Please fill all new vehicle fields");
//       return;
//     }

//     const net = Number(newNetRate);
//     const margin = Number(newMargin);
//     const gst = Number(newGST);
//     const grossRate = (net + margin) * (1 + gst / 100);

//     try {
//       await addDoc(collection(db, "vehicles"), {
//         name: newName,
//         netRate: net,
//         margin: margin,
//         gst: gst,
//         grossRate,
//       });

//       alert(`Vehicle "${newName}" added successfully!`);

//       // Clear form
//       setNewName("");
//       setNewNetRate("");
//       setNewMargin("");
//       setNewGST("");

//       // Refresh list after add
//       const snapshot = await getDocs(collection(db, "vehicles"));
//       setVehicles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
//     } catch (error) {
//       console.error("Error adding vehicle:", error);
//       alert("Failed to add vehicle.");
//     }
//   };

//   if (loading) return <p className="p-6">Loading vehicle rates...</p>;

//   return (
//     <div className="p-6 items-start pt-28 min-h-screen">
//       <h2 className="text-xl font-bold mb-4">Admin - Update Vehicle Rates</h2>

//       {/* New Vehicle Add Form */}
//       <form onSubmit={handleAddVehicle} className="mb-6 p-4 border rounded bg-gray-50">
//         <h3 className="font-semibold mb-2">Add New Vehicle</h3>
//         <input
//           type="text"
//           placeholder="Vehicle Name"
//           value={newName}
//           onChange={(e) => setNewName(e.target.value)}
//           className="border p-1 mr-2"
//           required
//         />
//         <input
//           type="number"
//           placeholder="Net Rate"
//           value={newNetRate}
//           onChange={(e) => setNewNetRate(e.target.value)}
//           className="border p-1 mr-2 w-24"
//           required
//         />
//         <input
//           type="number"
//           placeholder="Margin"
//           value={newMargin}
//           onChange={(e) => setNewMargin(e.target.value)}
//           className="border p-1 mr-2 w-24"
//           required
//         />
//         <input
//           type="number"
//           placeholder="GST (%)"
//           value={newGST}
//           onChange={(e) => setNewGST(e.target.value)}
//           className="border p-1 mr-2 w-20"
//           required
//         />
//         <button type="submit" className="bg-green-500 px-3 py-1 text-white rounded hover:bg-green-600">
//           Add Vehicle
//         </button>
//       </form>

//       {/* Existing Vehicles Table */}
//       <table className="w-full border-collapse border">
//         <thead>
//           <tr className="bg-gray-200">
//             <th className="border p-2">Vehicle</th>
//             <th className="border p-2">Net Rate (₹)</th>
//             <th className="border p-2">Margin (₹)</th>
//             <th className="border p-2">GST (%)</th>
//             <th className="border p-2">Gross Rate (₹)</th>
//             <th className="border p-2">Save</th>
//           </tr>
//         </thead>
//         <tbody>
//           {vehicles.map((v) => (
//             <tr key={v.id} className="border">
//               <td className="border p-2">{v.name}</td>
//               <td className="border p-2">
//                 <input
//                   type="number"
//                   value={v.netRate || ""}
//                   onChange={(e) => handleChange(v.id, "netRate", e.target.value)}
//                   className="border p-1 w-24"
//                 />
//               </td>
//               <td className="border p-2">
//                 <input
//                   type="number"
//                   value={v.margin || ""}
//                   onChange={(e) => handleChange(v.id, "margin", e.target.value)}
//                   className="border p-1 w-24"
//                 />
//               </td>
//               <td className="border p-2">
//                 <input
//                   type="number"
//                   value={v.gst || ""}
//                   onChange={(e) => handleChange(v.id, "gst", e.target.value)}
//                   className="border p-1 w-16"
//                 />
//               </td>
//               <td className="border p-2">
//                 ₹{((v.netRate + v.margin) * (1 + v.gst / 100)).toFixed(2)}
//               </td>
//               <td className="border p-2 text-center">
//                 <button
//                   className={`px-3 py-1 rounded text-white ${
//                     saving === v.id ? "bg-gray-500" : "bg-blue-500"
//                   }`}
//                   onClick={() => handleSave(v.id)}
//                   disabled={saving === v.id}
//                 >
//                   {saving === v.id ? "Saving..." : "Save"}
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default VehicleRateAdmin;


import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";

const DEFAULT_DURATIONS = [
  { id: "1N_2D", label: "1N/2D" },
  { id: "2N_3D", label: "2N/3D" },
  { id: "3N_4D", label: "3N/4D" },
];

const VehicleRateAdmin = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  // New vehicle form states
  const [newName, setNewName] = useState("");
  const [newNetRate, setNewNetRate] = useState("");
  const [newMargin, setNewMargin] = useState("");
  const [newGST, setNewGST] = useState("");

  // Outstation editing states
  const [expandedVehicleId, setExpandedVehicleId] = useState(null);
  const [ratesByVehicle, setRatesByVehicle] = useState({}); // { vehicleId: [ {id,label,net,margin,gst,gross}, ... ] }
  const [savingRatesId, setSavingRatesId] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const snapshot = await getDocs(collection(db, "vehicles"));
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setVehicles(data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        alert("Failed to load vehicles.");
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Keep your existing field editing behavior (local net/margin/gst)
  const handleChange = (id, field, value) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: Number(value) || 0 } : v))
    );
  };

  const handleSave = async (id) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;

    setSaving(id);

    const grossRate = (Number(vehicle.netRate || 0) + Number(vehicle.margin || 0)) * (1 + Number(vehicle.gst || 0) / 100);

    try {
      await updateDoc(doc(db, "vehicles", id), {
        netRate: Number(vehicle.netRate || 0),
        margin: Number(vehicle.margin || 0),
        gst: Number(vehicle.gst || 0),
        grossRate,
      });
      alert(`Rates for "${vehicle.name}" updated successfully!`);
      // update local state
      setVehicles((prev) => prev.map((p) => (p.id === id ? { ...p, grossRate } : p)));
    } catch (error) {
      console.error("Error updating rates:", error);
      alert("Failed to update rates.");
    } finally {
      setSaving(null);
    }
  };

  // Add vehicle (same as your code but ensure outstationRates exists as empty array)
  const handleAddVehicle = async (e) => {
    e.preventDefault();

    if (!newName || !newNetRate || !newMargin || !newGST) {
      alert("Please fill all new vehicle fields");
      return;
    }

    const net = Number(newNetRate);
    const margin = Number(newMargin);
    const gst = Number(newGST);
    const grossRate = (net + margin) * (1 + gst / 100);

    try {
      await addDoc(collection(db, "vehicles"), {
        name: newName,
        netRate: net,
        margin: margin,
        gst: gst,
        grossRate,
        capacity: 4, // optional default - update later in UI
        img: "",
        outstationRates: [], // initially empty; admin will add durations
      });

      alert(`Vehicle "${newName}" added successfully!`);

      // Clear form
      setNewName("");
      setNewNetRate("");
      setNewMargin("");
      setNewGST("");

      // Refresh list after add
      const snapshot = await getDocs(collection(db, "vehicles"));
      setVehicles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Failed to add vehicle.");
    }
  };

  /* ------- OUTSTATION RATE EDITING HELPERS ------- */

  // open manage rates UI for a vehicle
  const openManageRates = (vehicle) => {
    setExpandedVehicleId(vehicle.id);
    // copy existing array or default to empty
    setRatesByVehicle((prev) => ({
      ...prev,
      [vehicle.id]: (vehicle.outstationRates || []).map((r) => ({ ...r })),
    }));
  };

  const closeManageRates = (vehicleId) => {
    setExpandedVehicleId(null);
  };

  const handleRateChange = (vehicleId, idx, field, value) => {
    setRatesByVehicle((prev) => {
      const arr = prev[vehicleId] ? [...prev[vehicleId]] : [];
      const item = { ...(arr[idx] || {}) };
      if (field === "label") item[field] = value;
      else item[field] = Number(value) || 0;
      // recompute gross immediately (optional)
      item.gross = ((Number(item.net || 0) + Number(item.margin || 0)) * (1 + Number(item.gst || 0) / 100)) || 0;
      arr[idx] = item;
      return { ...prev, [vehicleId]: arr };
    });
  };

  const addDurationRow = (vehicleId) => {
    setRatesByVehicle((prev) => {
      const arr = prev[vehicleId] ? [...prev[vehicleId]] : [];
      const newRow = {
        id: Date.now().toString(),
        label: "custom",
        net: 0,
        margin: 0,
        gst: 18,
        gross: 0,
      };
      arr.push(newRow);
      return { ...prev, [vehicleId]: arr };
    });
  };

  const removeDurationRow = (vehicleId, idx) => {
    setRatesByVehicle((prev) => {
      const arr = prev[vehicleId] ? [...prev[vehicleId]] : [];
      arr.splice(idx, 1);
      return { ...prev, [vehicleId]: arr };
    });
  };

  const saveOutstationRates = async (vehicleId) => {
    const arr = ratesByVehicle[vehicleId] || [];
    const normalized = arr.map((r) => {
      const net = Number(r.net || 0);
      const margin = Number(r.margin || 0);
      const gst = Number(r.gst || 0);
      const gross = (net + margin) * (1 + gst / 100);
      return {
        id: String(r.id || (r.label || "").replace(/\W/g, "_")),
        label: r.label,
        net,
        margin,
        gst,
        gross,
      };
    });

    setSavingRatesId(vehicleId);
    try {
      await updateDoc(doc(db, "vehicles", vehicleId), { outstationRates: normalized });
      // update local vehicles state too
      setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? { ...v, outstationRates: normalized } : v)));
      alert("Outstation rates saved.");
      setExpandedVehicleId(null);
    } catch (err) {
      console.error("Error saving outstation rates:", err);
      alert("Failed to save outstation rates.");
    } finally {
      setSavingRatesId(null);
    }
  };

  // migration helper: add default durations to vehicles that don't have them
  const addDefaultDurationsToAll = async () => {
    if (!confirm("Add default durations (1N/2D,2N/3D,3N/4D) to vehicles missing outstationRates?")) return;

    setLoading(true);
    try {
      const updates = [];
      for (const v of vehicles) {
        if (!v.outstationRates || v.outstationRates.length === 0) {
          // create default durations using vehicle.netRate as baseline
          const arr = DEFAULT_DURATIONS.map((d) => {
            const net = Number(v.netRate || 0);
            const margin = Number(v.margin || 0);
            const gst = Number(v.gst || 0) || 18;
            const gross = (net + margin) * (1 + gst / 100);
            return { id: d.id, label: d.label, net, margin, gst, gross };
          });
          updates.push(updateDoc(doc(db, "vehicles", v.id), { outstationRates: arr }));
        }
      }
      await Promise.all(updates);
      alert("Default durations added where missing. Refreshing list...");
      const snapshot = await getDocs(collection(db, "vehicles"));
      setVehicles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      alert("Migration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="p-6">Loading vehicle rates...</p>;

  return (
    <div className="p-6 items-start pt-28 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Admin - Update Vehicle Rates</h2>

      <div className="mb-4">
        <button
          className="bg-yellow-500 text-black px-3 py-1 rounded mr-2"
          onClick={addDefaultDurationsToAll}
        >
          Add default outstation durations to vehicles (migration)
        </button>
      </div>

      {/* New Vehicle Add Form */}
      <form onSubmit={handleAddVehicle} className="mb-6 p-4 border rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Add New Vehicle</h3>
        <input
          type="text"
          placeholder="Vehicle Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-1 mr-2"
          required
        />
        <input
          type="number"
          placeholder="Net Rate"
          value={newNetRate}
          onChange={(e) => setNewNetRate(e.target.value)}
          className="border p-1 mr-2 w-24"
          required
        />
        <input
          type="number"
          placeholder="Margin"
          value={newMargin}
          onChange={(e) => setNewMargin(e.target.value)}
          className="border p-1 mr-2 w-24"
          required
        />
        <input
          type="number"
          placeholder="GST (%)"
          value={newGST}
          onChange={(e) => setNewGST(e.target.value)}
          className="border p-1 mr-2 w-20"
          required
        />
        <button type="submit" className="bg-green-500 px-3 py-1 text-white rounded hover:bg-green-600">
          Add Vehicle
        </button>
      </form>

      {/* Existing Vehicles Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Vehicle</th>
            <th className="border p-2">Net Rate (₹)</th>
            <th className="border p-2">Margin (₹)</th>
            <th className="border p-2">GST (%)</th>
            <th className="border p-2">Gross Rate (₹)</th>
            <th className="border p-2">Outstation Rates</th>
            <th className="border p-2">Save</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <React.Fragment key={v.id}>
              <tr className="border">
                <td className="border p-2">{v.name}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={v.netRate || ""}
                    onChange={(e) => handleChange(v.id, "netRate", e.target.value)}
                    className="border p-1 w-24"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={v.margin || ""}
                    onChange={(e) => handleChange(v.id, "margin", e.target.value)}
                    className="border p-1 w-24"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={v.gst || ""}
                    onChange={(e) => handleChange(v.id, "gst", e.target.value)}
                    className="border p-1 w-16"
                  />
                </td>
                <td className="border p-2">₹{(((Number(v.netRate || 0) + Number(v.margin || 0)) * (1 + Number(v.gst || 0) / 100)) || 0).toFixed(2)}</td>
                <td className="border p-2 text-center">
                  <button
                    className="bg-indigo-600 text-white px-3 py-1 rounded"
                    onClick={() => openManageRates(v)}
                  >
                    Manage Outstation Rates
                  </button>
                </td>
                <td className="border p-2 text-center">
                  <button
                    className={`px-3 py-1 rounded text-white ${saving === v.id ? "bg-gray-500" : "bg-blue-500"}`}
                    onClick={() => handleSave(v.id)}
                    disabled={saving === v.id}
                  >
                    {saving === v.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>

              {/* Expandable panel for outstation rates editing */}
              {expandedVehicleId === v.id && (
                <tr>
                  <td className="border p-4 bg-gray-50" colSpan={7}>
                    <h4 className="font-semibold mb-2">Outstation Rates for: {v.name}</h4>

                    <table className="w-full mb-3">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 border">Label (e.g. 1N/2D)</th>
                          <th className="p-2 border">Net (₹)</th>
                          <th className="p-2 border">Margin (₹)</th>
                          <th className="p-2 border">GST (%)</th>
                          <th className="p-2 border">Gross (₹)</th>
                          <th className="p-2 border">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ratesByVehicle[v.id] || []).map((r, idx) => (
                          <tr key={r.id || idx}>
                            <td className="p-2 border">
                              <input value={r.label}
                                onChange={(e) => handleRateChange(v.id, idx, "label", e.target.value)}
                                className="border p-1 w-full" />
                            </td>
                            <td className="p-2 border">
                              <input type="number" value={r.net || 0}
                                onChange={(e) => handleRateChange(v.id, idx, "net", e.target.value)}
                                className="border p-1 w-28" />
                            </td>
                            <td className="p-2 border">
                              <input type="number" value={r.margin || 0}
                                onChange={(e) => handleRateChange(v.id, idx, "margin", e.target.value)}
                                className="border p-1 w-28" />
                            </td>
                            <td className="p-2 border">
                              <input type="number" value={r.gst || 0}
                                onChange={(e) => handleRateChange(v.id, idx, "gst", e.target.value)}
                                className="border p-1 w-20" />
                            </td>
                            <td className="p-2 border">₹{(r.gross || 0).toFixed(2)}</td>
                            <td className="p-2 border text-center">
                              <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => removeDurationRow(v.id, idx)}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex gap-2 items-center mb-3">
                      <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => addDurationRow(v.id)}>Add Duration Row</button>
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => saveOutstationRates(v.id)}
                        disabled={savingRatesId === v.id}
                      >
                        {savingRatesId === v.id ? "Saving..." : "Save Outstation Rates"}
                      </button>
                      <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => closeManageRates(v.id)}>Close</button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VehicleRateAdmin;
