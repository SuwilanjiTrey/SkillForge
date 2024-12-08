import React, { useEffect, useState } from "react";
import { db } from "../AnA/firebase.js";
import { collection, getDocs } from "firebase/firestore";

const AdminDashboard = () => {
    const [visitorCount, setVisitorCount] = useState(0);
    const [memberCount, setMemberCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const visitorsSnapshot = await getDocs(collection(db, "visitors"));
                setVisitorCount(visitorsSnapshot.size);

                const membersSnapshot = await getDocs(collection(db, "members"));
                setMemberCount(membersSnapshot.size);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Admin Dashboard</h1>
            <p>Number of Visitors: {visitorCount}</p>
            <p>Number of Members: {memberCount}</p>
        </div>
    );
};

export default AdminDashboard;
