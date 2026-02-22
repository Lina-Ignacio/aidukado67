import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaBook,
  FaClock,
  FaBullseye,
  FaKey,
  FaExclamationTriangle,
  FaLightbulb,
  FaChevronRight,
  FaArrowLeft,
  FaBrain,
  FaMemory,
  FaBolt,
  FaCheckCircle,
  FaGraduationCap,
  FaAward,
  FaFlag
} from 'react-icons/fa';
import UserDropup from '../../components/DropUp/UserDropUp';

export default function Summary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { materialId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // 1. Get lesson first
        const lessonRes = await axios.get(`${import.meta.env.VITE_API_URL}/getLesson/${materialId}`);
        console.log("test", lessonRes.data)
        // 2. Prepare form data
        const formData = new FormData();
        formData.append('material_id', lessonRes.data.material_id);
        formData.append('lesson_content', lessonRes.data.extracted_content);
        
        // 3. Single POST request that handles cache
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/generateSummary`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        
        // 4. Access the correct structure from response
        console.log("Summary response:", response.data);
        
        // The summary is in response.data.summary
        if (response.data && response.data.summary) {
          setSummary(response.data.summary);
          
          // Show status message
          if (response.data.generated_new === false) {
            console.log("✓ Using cached summary from database");
          } else {
            console.log("✓ Generated new summary");
          }
        } else {
          console.error("Unexpected response structure:", response.data);
          setError("Invalid response format from server");
        }
        
      } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        setError("Failed to generate summary. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [materialId]);

  const handleClick = () => {
    navigate(-1);
  };

  // Render JSON summary - UPDATED to match backend structure
  const renderJSONSummary = (data) => {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return <div className="text-center p-8 text-gray-500">No summary data available</div>;
    }

    return (
      <div className="space-y-8">
        <UserDropup />
        
        {/* Header with Metadata */}
        <div className="bg-gradient-to-r from-[#102E50]/5 to-[#E78B48]/5 p-6 rounded-2xl border border-[#102E50]/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#102E50]">
                {data.title || 'Lesson Summary'}
              </h1>
              {data.summaryMetadata && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-sm text-[#E78B48] bg-white px-3 py-1 rounded-full border">
                    <FaClock size={12} /> {data.summaryMetadata.estimatedReadTime || '5-8 minutes'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Executive Summary */}
          {data.executiveSummary && (
            <div className="mt-6 p-4 bg-white rounded-xl border-l-4 border-[#E78B48] shadow-sm">
              <p className="text-lg text-[#1F2937] italic font-medium">"{data.executiveSummary}"</p>
            </div>
          )}
        </div>

        {/* MUST KNOW Section - From backend */}
        {data.mustKnow && data.mustKnow.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">MUST KNOW</h2>
            </div>
            <div className="space-y-3">
              {data.mustKnow.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <FaCheckCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[#1F2937] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KEY TAKEAWAYS Section - From backend */}
        {data.keyTakeaways && data.keyTakeaways.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaLightbulb className="text-blue-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">Key Takeaways</h2>
            </div>
            <div className="space-y-3">
              {data.keyTakeaways.map((point, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <FaChevronRight className="text-[#102E50] flex-shrink-0 mt-1" />
                  <p className="text-[#1F2937]">{point}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ESSENTIAL TERMS Section - From backend (converted from object to array) */}
        {data.essentialTerms && Object.keys(data.essentialTerms).length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaBook className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">Essential Terms</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(data.essentialTerms).map(([term, definition], index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 transition">
                  <h3 className="font-bold text-[#6B28A9] mb-2">{term}</h3>
                  <p className="text-[#6B7280]">{definition}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PRACTICAL APPLICATIONS Section - From backend */}
        {data.practicalApplications && data.practicalApplications.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaGraduationCap className="text-green-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">Practical Applications</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {data.practicalApplications.map((app, index) => (
                <div key={index} className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                  <p className="text-[#1F2937]">{app}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COMMON TRAPS Section - From backend */}
        {data.commonTraps && data.commonTraps.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaExclamationTriangle className="text-orange-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">Common Traps & Mistakes</h2>
            </div>
            <div className="space-y-3">
              {data.commonTraps.map((trap, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <FaExclamationTriangle className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[#1F2937]">{trap}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MEMORY HOOKS Section - From backend */}
        {data.memoryHooks && data.memoryHooks.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaBrain className="text-yellow-600 text-xl" />
              </div>
              <h2 className="text-xl font-bold text-[#102E50]">Memory Hooks & Mnemonics</h2>
            </div>
            <div className="space-y-3">
              {data.memoryHooks.map((hook, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                  <FaMemory className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[#1F2937]">{hook}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FINAL ACTION Section - From backend */}
        {(data.ifYouRememberOneThing || data.nextAction) && (
          <section className="bg-gradient-to-r from-[#102E50] to-[#1E3A8A] text-white rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaAward className="text-white text-2xl" />
              <h2 className="text-xl font-bold">Final Takeaways</h2>
            </div>
            
            {data.ifYouRememberOneThing && (
              <div className="mb-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-3 text-lg">🎯 If You Remember One Thing:</h3>
                <p className="text-xl font-medium text-white/90">{data.ifYouRememberOneThing}</p>
              </div>
            )}
            
            {data.nextAction && (
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-3 text-lg">🚀 Your Next Action:</h3>
                <p className="text-xl font-medium text-white/90">{data.nextAction}</p>
              </div>
            )}
            
            {/* Metadata info */}
            {data.summaryMetadata && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex flex-wrap gap-3 text-sm text-white/70">
                  <span>Generated: {new Date(data.summaryMetadata.generatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Model: {data.summaryMetadata.model || 'AI-generated'}</span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#102E50]"></div>
            <p className="mt-4 text-[#6B7280] font-medium">Generating your optimized summary...</p>
            <p className="mt-2 text-sm text-gray-500">Condensing 60 minutes into 5-8 minutes</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex justify-center items-center min-h-screen p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl p-8 shadow-lg border border-red-200">
            <div className="text-center">
              <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Something went wrong</h2>
              <p className="text-[#6B7280] mb-6">{error}</p>
              <button
                onClick={handleClick}
                className="inline-flex items-center gap-2 bg-[#102E50] hover:bg-[#0A2038] text-white font-medium px-6 py-3 rounded-lg transition"
              >
                <FaArrowLeft />
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {!loading && !error && summary && (
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button at top */}
            <div className="mb-6">
              <button
                onClick={handleClick}
                className="inline-flex items-center gap-2 bg-[#102E50] hover:bg-[#0A2038] text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
              >
                <FaArrowLeft />
                Back to Lesson
              </button>
            </div>

            {/* Summary Content */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
              {/* Decorative Header */}
              <div className="h-2 bg-gradient-to-r from-[#102E50] via-[#E78B48] to-[#102E50]"></div>
              
              <div className="p-6 md:p-8 lg:p-10">
                {renderJSONSummary(summary)}
                
                {/* Footer Actions */}
                <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-[#6B7280]">
                    <p className="flex items-center gap-1">
                      <FaLightbulb className="text-[#E78B48]" />
                      This Summary is made by AI
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClick}
                      className="inline-flex items-center gap-2 bg-[#102E50] hover:bg-[#0A2038] text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
                    >
                      <FaArrowLeft />
                      Return to Lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}