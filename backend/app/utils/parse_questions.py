import re

def parse_questions(raw_questions: str):
    """
    Parse questions from AI response with flexible format handling
    Supports: "1." or "1)" for questions, "A)" or "A." for options
    Also handles True/False with/without bold formatting
    """
    questions = []
    current = {}
    
    # Split into lines and process
    lines = raw_questions.strip().split("\n")
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        if not line:  # Skip empty lines
            i += 1
            continue
        
        # Question pattern: starts with number and dot/period/parenthesis
        if re.match(r"^\d+[\.\)]\s", line):
            # Save previous question if exists
            if current and current.get("question"):
                questions.append(current)
            
            # Start new question
            current = {
                "question": line,
                "options": [],
                "answer": None,
            }
            i += 1
            
        # Option pattern: A) or A. (for multiple choice)
        elif re.match(r"^[A-D][\)\.]\s*", line) and current:
            # Remove the option letter and parenthesis/dot, keep the text
            option_text = re.sub(r"^[A-D][\)\.]\s*", "", line)
            current["options"].append(option_text)
            i += 1
            
        # Answer pattern (case insensitive)
        elif line.lower().startswith("answer:") and current:
            # Extract answer part after "Answer:"
            answer_part = line.split(":", 1)[-1].strip()
            
            # Clean up answer - remove bold, quotes, periods
            answer_clean = re.sub(r'[\*\*\"\'\.\)]', '', answer_part).strip()
            
            # Check for True/False (case insensitive)
            if answer_clean.upper() in ['TRUE', 'FALSE']:
                current["answer"] = answer_clean.capitalize()  # Convert to "True"/"False"
            else:
                # If not True/False, look for A-D letter
                answer_match = re.search(r"[A-D]", answer_clean.upper())
                if answer_match:
                    current["answer"] = answer_match.group()
                else:
                    # Last resort: keep the cleaned answer
                    current["answer"] = answer_clean
            
            i += 1
            
        else:
            # This might be a continuation of the previous question
            # or an explanation line we want to ignore
            if current and current.get("question"):
                # Check if this line looks like an explanation (starts with * or Explanation:)
                if line.startswith('*') or line.lower().startswith('explanation'):
                    # Skip explanation lines - don't add to question
                    pass
                else:
                    # Could be a multi-line question - append to question
                    current["question"] = current["question"] + " " + line
            i += 1
    
    # Don't forget the last question
    if current and current.get("question"):
        questions.append(current)
    
    # Debug output
    print(f"\n📋 PARSED {len(questions)} QUESTIONS:")
    for idx, q in enumerate(questions, 1):
        print(f"  Q{idx}: {q['question'][:50]}...")
        print(f"     Answer: {q['answer']}")
        if q['options']:
            print(f"     Options: {len(q['options'])}")
    
    return questions


def validate_questions(questions, question_type, expected_count):
    """
    Validate parsed questions based on question type
    Returns filtered valid questions and validation stats
    """
    valid_questions = []
    validation_errors = []
    
    for i, q in enumerate(questions, 1):
        if question_type == "multiple_choice":
            # Check multiple choice requirements
            if not q.get('options'):
                validation_errors.append(f"Q{i}: No options found")
            elif len(q['options']) != 4:
                validation_errors.append(f"Q{i}: Expected 4 options, got {len(q['options'])}")
            elif not q.get('answer'):
                validation_errors.append(f"Q{i}: No answer found")
            elif q['answer'] not in ['A', 'B', 'C', 'D']:
                validation_errors.append(f"Q{i}: Invalid answer '{q['answer']}' (must be A,B,C,D)")
            else:
                valid_questions.append(q)
                
        elif question_type == "true_false":
            # Check true/false requirements
            if not q.get('answer'):
                validation_errors.append(f"Q{i}: No answer found")
            elif q['answer'] not in ['True', 'False']:
                validation_errors.append(f"Q{i}: Invalid answer '{q['answer']}' (must be True/False)")
            elif q.get('options'):  # True/False shouldn't have options
                validation_errors.append(f"Q{i}: True/False question should not have options")
            else:
                # Ensure answer is exactly "True" or "False" (capitalized)
                if q['answer'].capitalize() in ['True', 'False']:
                    q['answer'] = q['answer'].capitalize()
                    valid_questions.append(q)
                else:
                    validation_errors.append(f"Q{i}: Invalid answer format '{q['answer']}'")
        else:
            # Generic validation
            if q.get('question') and q.get('answer'):
                valid_questions.append(q)
            else:
                validation_errors.append(f"Q{i}: Missing question or answer")
    
    # Print validation summary
    if validation_errors:
        print(f"\n⚠️  Validation errors ({len(validation_errors)}):")
        for error in validation_errors[:5]:  # Show first 5 errors
            print(f"   - {error}")
        if len(validation_errors) > 5:
            print(f"   ... and {len(validation_errors) - 5} more")
    
    return valid_questions