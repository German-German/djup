import re

# Fix OverviewPage.jsx
with open('frontend/src/pages/OverviewPage.jsx', 'r') as f:
    content = f.read()

head_match = re.search(r'<<<<<<< HEAD\n(.*?)=======', content, re.DOTALL)
if not head_match:
    print("OverviewPage: Merge markers not found.")
else:
    head_content = head_match.group(1)
    # Add imports
    head_content = head_content.replace(
        "import React, { useMemo } from 'react';",
        "import React, { useMemo, useState, useEffect } from 'react';\nimport axios from 'axios';"
    )
    head_content = head_content.replace(
        "Maximize2\n} from 'lucide-react';",
        "Maximize2,\n  Bot,\n  ChevronDown,\n  ChevronUp,\n  Sparkles,\n  Zap\n} from 'lucide-react';"
    )
    
    # Add state and useEffect
    state_code = """
  const [commentaryData, setCommentaryData] = useState(null);
  const [commentaryLoading, setCommentaryLoading] = useState(true);
  const [commentaryExpanded, setCommentaryExpanded] = useState(false);

  useEffect(() => {
    async function fetchCommentary() {
      try {
        const res = await axios.get('/api/commentary/latest');
        setCommentaryData(res.data);
      } catch (err) {
        console.error("Failed to load commentary:", err);
      } finally {
        setCommentaryLoading(false);
      }
    }
    fetchCommentary();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
"""
    head_content = head_content.replace(
        "const { data: macroOverlay, loading: macroLoading } = useApi('/macro/overlay?series=hy_spread');",
        "const { data: macroOverlay, loading: macroLoading } = useApi('/macro/overlay?series=hy_spread');\n" + state_code
    )
    
    # Add AI Commentary Panel to the end of the bento grid
    commentary_panel = """
        {/* AI Commentary Panel */}
        <div className="col-span-12 h-auto binance-panel overflow-hidden transition-all duration-300">
          <div 
            className="px-5 py-4 border-b border-[#2B2F36] flex justify-between items-center bg-[#1E2329]/50 cursor-pointer hover:bg-[#2B2F36]/50 transition-colors"
            onClick={() => setCommentaryExpanded(!commentaryExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full w-8 h-8">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-[14px] text-[#EAECEF] uppercase tracking-wider flex items-center">
                    AI Market Commentary
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI INSIGHT
                  </span>
                </div>
                <p className="text-[11px] text-[#848E9C] mt-0.5">
                  {commentaryLoading ? "GENERATING INSIGHTS..." : `UPDATED ${formatDate(commentaryData?.date).toUpperCase()}`}
                </p>
              </div>
            </div>
            <button className="p-2 text-[#848E9C] hover:text-[#EAECEF] rounded-full">
              {commentaryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          {commentaryExpanded && (
            <div className="p-6 bg-[#181A20]">
              {commentaryLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-[#2B2F36] rounded w-3/4"></div>
                  <div className="h-4 bg-[#2B2F36] rounded w-full"></div>
                  <div className="h-4 bg-[#2B2F36] rounded w-5/6"></div>
                </div>
              ) : commentaryData ? (
                <div className="prose prose-sm max-w-none text-[#EAECEF] leading-relaxed">
                  {commentaryData.commentary_text.split('\\n').map((paragraph, idx) => (
                    <p key={idx} className={paragraph.trim() ? "mb-4 text-[#848E9C]" : ""}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[#848E9C] text-sm">Commentary is currently unavailable.</p>
              )}
            </div>
          )}
        </div>
      </div>
"""
    head_content = head_content.replace(
        "</div>\n      </div>\n    </div>\n  );\n};\n\nexport default OverviewPage;",
        commentary_panel + "\n    </div>\n  );\n};\n\nexport default OverviewPage;"
    )

    with open('frontend/src/pages/OverviewPage.jsx', 'w') as f:
        f.write(head_content)
    print("OverviewPage fixed.")
