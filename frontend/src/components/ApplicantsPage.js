import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

const ApplicantsPage = () => {
  const { taskId } = useParams();
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    // Fetch applicants for the task
    const fetchApplicants = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/projects/${taskId}/applicants`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Include the auth token
            },
          }
        );
        setApplicants(response.data.applicants);
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };

    fetchApplicants();
  }, [taskId]);

  const acceptApplicant = async (userId) => {
    try {
      await axios.post(
        `http://localhost:5000/projects/${taskId}/collaborators/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Include the auth token
          },
        }
      );
      // Remove the accepted applicant from the list
      setApplicants((prev) => prev.filter((applicant) => applicant._id !== userId));
    } catch (error) {
      console.error("Error accepting applicant:", error);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Applicants for Task</h2>
        {applicants.length === 0 ? (
          <p className="text-gray-400">No applicants yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {applicants.map((applicant) => (
              <div
                key={applicant._id}
                className="p-4 border rounded-xl bg-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <p className="text-white">
                  <span className="font-medium">User Name:</span> {applicant.username}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Email Id:</span> {applicant.email}
                </p>
                <button
                  onClick={() => acceptApplicant(applicant._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded mt-2 transform transition-all duration-300 hover:scale-105 hover:bg-green-600"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantsPage;