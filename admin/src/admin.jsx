import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";

// --- Firebase Configuration ---
// These global variables will be provided in the runtime environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Pseudo Data for Presentation ---
const pseudoIssues = [
  {
    id: 'pseudo1',
    userName: 'Priya S.',
    description: 'Large pothole on Sardar Patel Road near Adyar signal, causing severe traffic jams.',
    address: 'Sardar Patel Road, Adyar, Chennai',
    imageUrl: 'https://placehold.co/600x400/F1F8E8/000000?text=Pothole+Issue',
    status: 'active',
    employee: null,
    createdAt: new Date('2025-09-05T10:00:00Z'),
  },
  {
    id: 'pseudo2',
    userName: 'Kumar R.',
    description: 'Streetlight number P-15 is not working for the past week. It is very dark and unsafe at night.',
    address: 'Thiruvalluvar Salai, T. Nagar, Chennai',
    imageUrl: 'https://placehold.co/600x400/F1F8E8/000000?text=Broken+Streetlight',
    status: 'In Progress',
    employee: { name: 'Ravi Kumar', contact: 'Electrical Dept.' },
    createdAt: new Date('2025-09-03T14:30:00Z'),
  },
  {
    id: 'pseudo3',
    userName: 'Anjali V.',
    description: 'Garbage has been overflowing from the public bin for over 3 days. It is starting to smell.',
    address: 'Velachery Main Road, Velachery, Chennai',
    imageUrl: 'https://placehold.co/600x400/F1F8E8/000000?text=Garbage+Overflow',
    status: 'Resolved',
    employee: { name: 'Suresh M.', contact: 'Sanitation Dept.' },
    createdAt: new Date('2025-09-01T09:15:00Z'),
  },
];


// --- Main App Component ---
export default function App() {
    const [activePage, setActivePage] = useState("dashboard");
    const [issues, setIssues] = useState(pseudoIssues);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [employeeForm, setEmployeeForm] = useState({ name: "", contact: "" });
    const [assigningIssue, setAssigningIssue] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [newIssueForm, setNewIssueForm] = useState({ userName: "", description: "", address: "" });


    // --- Firebase Data Fetching ---
    useEffect(() => {
        const authAndInit = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
                setIsAuthReady(true);
            } catch (error) {
                console.error("Authentication failed:", error);
            }
        };
        authAndInit();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;

        const complaintsCollection = collection(db, `artifacts/${appId}/public/data/complaints`);
        const unsubscribe = onSnapshot(complaintsCollection, (snapshot) => {
            if (snapshot.empty) {
                setIssues(pseudoIssues); // If DB is empty, keep showing pseudo data
                return;
            }
            const complaintsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to JS Date for sorting
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })).sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first
            setIssues(complaintsData);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, [isAuthReady]);

    // --- Admin Actions (writing back to Firebase) ---
    async function updateStatus(id, newStatus) {
        if (id.startsWith('pseudo')) {
            // Handle state update for pseudo data locally
            setIssues(issues.map(i => i.id === id ? { ...i, status: newStatus } : i));
            return;
        }
        const issueDoc = doc(db, `artifacts/${appId}/public/data/complaints`, id);
        try {
            await updateDoc(issueDoc, { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    async function saveEmployee(e) {
        e.preventDefault();
        if (assigningIssue.startsWith('pseudo')) {
            // Handle state update for pseudo data locally
            setIssues(issues.map(i => i.id === assigningIssue ? { ...i, employee: { ...employeeForm }, status: 'In Progress' } : i));
            setEmployeeForm({ name: "", contact: "" });
            setAssigningIssue(null);
            setActivePage("issues");
            return;
        }

        const issueDoc = doc(db, `artifacts/${appId}/public/data/complaints`, assigningIssue);
        try {
            await updateDoc(issueDoc, {
                employee: { ...employeeForm },
                status: "In Progress"
            });
            setEmployeeForm({ name: "", contact: "" });
            setAssigningIssue(null);
            setActivePage("issues");
        } catch (error) {
            console.error("Error assigning employee:", error);
        }
    }
    
    async function saveNewIssue(e) {
        e.preventDefault();
        try {
            const complaintsCollection = collection(db, `artifacts/${appId}/public/data/complaints`);
            await addDoc(complaintsCollection, {
                ...newIssueForm,
                status: 'active',
                createdAt: serverTimestamp(),
                imageUrl: 'https://placehold.co/600x400/F1F8E8/000000?text=Admin+Added', // Placeholder image
                employee: null,
            });
            setNewIssueForm({ userName: "", description: "", address: "" }); // Reset form
            setActivePage("issues"); // Go back to issues page
        } catch (error) {
            console.error("Error adding new issue:", error);
        }
    }

    // --- Calculated Data for Dashboard ---
    const resolved = issues.filter((i) => i.status === "Resolved").length;
    const progress = issues.length > 0 ? Math.round((resolved / issues.length) * 100) : 0;
    const pendingCount = issues.filter((i) => i.status === "active").length;
    const inProgressCount = issues.filter((i) => i.status === "In Progress").length;
    

    // --- JSX ---
    return (
        <div className="flex min-h-screen bg-[#F1F8E8] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#55AD9B] text-white p-6 space-y-4 shadow-lg">
                <h2 className="text-2xl font-bold text-center">CivicTrack Admin</h2>
                <nav className="space-y-2 pt-4">
                    {["dashboard", "issues", "resolved"].map((page) => (
                        <button
                            key={page}
                            className={`block w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                                activePage === page ? "bg-[#D8EFD3] text-[#55AD9B] font-bold" : "hover:bg-white/20"
                            }`}
                            onClick={() => setActivePage(page)}
                        >
                            {page.charAt(0).toUpperCase() + page.slice(1)}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 space-y-6">
                {/* Dashboard View */}
                {activePage === "dashboard" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <h3 className="text-gray-500 font-semibold">Total Issues</h3>
                                <p className="text-3xl font-bold text-[#55AD9B] mt-2">{issues.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <h3 className="text-gray-500 font-semibold">Pending</h3>
                                <p className="text-3xl font-bold text-yellow-500 mt-2">{pendingCount}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <h3 className="text-gray-500 font-semibold">In Progress</h3>
                                <p className="text-3xl font-bold text-blue-500 mt-2">{inProgressCount}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <h3 className="text-gray-500 font-semibold">Resolved</h3>
                                <p className="text-3xl font-bold text-green-500 mt-2">{resolved}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="font-semibold mb-3 text-gray-700">Resolution Progress</h3>
                            <div className="w-full bg-gray-200 rounded-full h-5">
                                <div
                                    className="bg-[#95D2B3] h-5 rounded-full text-center text-white font-bold text-sm transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                >
                                  {progress > 10 ? `${progress}%` : ''}
                                </div>
                            </div>
                            <p className="text-sm mt-2 text-right text-gray-600">{progress}% Resolved</p>
                        </div>
                    </>
                )}

                {/* Issues View */}
                {activePage === "issues" && (
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-xl text-gray-800">Reported Issues</h3>
                             <button onClick={() => setActivePage('addIssue')} className="px-4 py-2 bg-[#55AD9B] text-white rounded-lg hover:bg-[#4A9687] font-semibold">
                                Add New Issue
                             </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#D8EFD3] text-gray-600 uppercase">
                                    <tr>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3">Location</th>
                                        <th className="p-3">Image</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Assigned To</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.filter(i => i.status !== 'Resolved').map((issue) => (
                                        <tr key={issue.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{issue.userName}</td>
                                            <td className="p-3 max-w-xs truncate">{issue.description}</td>
                                            <td className="p-3">{issue.address}</td>
                                            <td className="p-3">
                                                <button onClick={() => setSelectedImage(issue.imageUrl)} className="text-[#55AD9B] hover:underline">View</button>
                                            </td>
                                            <td className="p-3 font-medium">{issue.status}</td>
                                            <td className="p-3">{issue.employee ? `${issue.employee.name}` : "N/A"}</td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-2 w-36">
                                                    <button onClick={() => updateStatus(issue.id, "In Progress")} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs">In Progress</button>
                                                    <button onClick={() => updateStatus(issue.id, "Resolved")} className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs">Resolve</button>
                                                    <button onClick={() => { setAssigningIssue(issue.id); setActivePage("assign"); }} className="px-3 py-1 bg-[#55AD9B] text-white rounded-md hover:bg-[#4A9687] text-xs">Assign</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                 {/* Resolved Issues View */}
                {activePage === "resolved" && (
                     <div className="bg-white p-4 rounded-xl shadow-lg">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Resolved Issues</h3>
                        <div className="overflow-x-auto">
                           <ul className="space-y-3">
                              {issues.filter(i => i.status === 'Resolved').map((i) => (
                                <li key={i.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                                   <div>
                                     <p><span className="font-bold">{i.description}</span> at {i.address}</p>
                                     <p className="text-sm text-gray-600">Assigned to: {i.employee ? i.employee.name : "N/A"}</p>
                                   </div>
                                   <button onClick={() => updateStatus(i.id, "In Progress")} className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-xs font-semibold">
                                        Reopen
                                   </button>
                                </li>
                              ))}
                           </ul>
                        </div>
                    </div>
                )}

                {/* Assign Employee Page */}
                {activePage === "assign" && assigningIssue && (
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Assign Employee</h3>
                        <form onSubmit={saveEmployee} className="space-y-4">
                            <input type="text" placeholder="Employee Name" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#55AD9B]" required />
                            <input type="text" placeholder="Contact Info (e.g., Phone)" value={employeeForm.contact} onChange={(e) => setEmployeeForm({ ...employeeForm, contact: e.target.value })} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#55AD9B]" required />
                            <div className="flex gap-4">
                               <button type="submit" className="px-4 py-2 bg-[#55AD9B] text-white rounded-lg hover:bg-[#4A9687]">Save Assignment</button>
                               <button type="button" onClick={()=> setActivePage('issues')} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                
                {/* Add New Issue Page */}
                {activePage === "addIssue" && (
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg mx-auto">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Add New Issue Manually</h3>
                        <form onSubmit={saveNewIssue} className="space-y-4">
                            <input type="text" placeholder="Reporter's Name" value={newIssueForm.userName} onChange={(e) => setNewIssueForm({ ...newIssueForm, userName: e.target.value })} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#55AD9B]" required />
                            <textarea placeholder="Issue Description" value={newIssueForm.description} onChange={(e) => setNewIssueForm({ ...newIssueForm, description: e.target.value })} className="border rounded-lg px-3 py-2 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#55AD9B]" required />
                            <input type="text" placeholder="Address / Landmark" value={newIssueForm.address} onChange={(e) => setNewIssueForm({ ...newIssueForm, address: e.target.value })} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#55AD9B]" required />
                            <div className="flex gap-4">
                               <button type="submit" className="px-4 py-2 bg-[#55AD9B] text-white rounded-lg hover:bg-[#4A9687]">Save Issue</button>
                               <button type="button" onClick={()=> setActivePage('issues')} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
                    <img src={selectedImage} alt="Complaint Detail" className="max-w-screen-md max-h-screen-md rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
}

