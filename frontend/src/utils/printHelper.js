/**
 * Generate HTML for printing quiz
 * @param {Object} config - Configuration object
 * @param {string} config.title - Quiz title
 * @param {string} config.instructions - Quiz instructions
 * @param {number} config.total_points - Total points
 * @param {number} config.duration - Duration in minutes
 * @param {Array} config.questions - Array of questions
 * @param {Array} config.optionLetters - Option letters (e.g., ['A', 'B', 'C', 'D'])
 * @returns {string} - HTML string
 */
export const generatePrintHTML = ({
  title,
  instructions,
  total_points,
  duration,
  questions,
  optionLetters
}) => {
  const questionsHTML = questions
    .map((q, idx) => {
      const isTrueFalse = !q.options || q.options.length === 0;
      
      return `
        <div class="question">
          <p><strong>${idx + 1}. ${q.question}</strong></p>
          ${q.questionImage ? `<img src="${q.questionImage}" alt="Question Image" />` : ""}
          
          ${isTrueFalse 
            ? '<p><em>True or False</em></p>' 
            : `<ul class="options">
                ${q.options.map((opt, i) => `
                  <li>
                    ${optionLetters[i]}. ${opt.text || ""}
                    ${opt.image ? `<br><img src="${opt.image}" alt="Option Image" />` : ""}
                  </li>
                `).join("")}
              </ul>`
          }
        </div>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { 
            text-align: center;
            margin-bottom: 10px;
          }
          .meta-info {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .meta-info p {
            margin: 5px 0;
          }
          .question { 
            margin-bottom: 25px; 
            page-break-inside: avoid; 
          }
          .options { 
            margin-left: 20px; 
            list-style-type: none;
            padding-left: 0;
          }
          .options li { 
            margin-bottom: 8px;
            padding: 5px 0;
          }
          img { 
            max-width: 200px; 
            margin-top: 10px; 
            display: block;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px;
          }
          @media print {
            .question {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        
        <div class="meta-info">
          <p><strong>Instructions:</strong> ${instructions || 'N/A'}</p>
          <p><strong>Total Points:</strong> ${total_points}</p>
          <p><strong>Duration:</strong> ${duration} minutes</p>
        </div>
        
        ${questionsHTML}
      </body>
    </html>
  `;
};