import re
from typing import List

class ContentCompressor:
    """Aggressively compresses lesson content to save tokens"""
    
    @staticmethod
    def compress_content(content: str, target_tokens: int = 2000) -> str:
        """
        Compress content to target token count while preserving key information.
        """
        # First pass: Remove unnecessary elements
        compressed = ContentCompressor._remove_excess(content)
        
        # Estimate current tokens
        estimated = ContentCompressor.estimate_tokens(compressed)
        
        # If already under target, return as-is
        if estimated <= target_tokens:
            print(f"[COMPRESS] Already at target: {estimated:,} tokens")
            return compressed
        
        # If still too large, apply more aggressive compression
        if estimated > target_tokens:
            compressed = ContentCompressor._aggressive_compress(compressed, target_tokens)
        
        final_tokens = ContentCompressor.estimate_tokens(compressed)
        print(f"[COMPRESS] {ContentCompressor.estimate_tokens(content):,} → {final_tokens:,} tokens ({final_tokens/target_tokens*100:.1f}% of target)")
        
        return compressed
    
    @staticmethod
    def _remove_excess(content: str) -> str:
        """Remove unnecessary formatting and fluff"""
        # Remove excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        # Remove markdown formatting but keep structure
        content = re.sub(r'#{1,6}\s*', '', content)  # Remove headings markers
        content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)  # Remove bold
        content = re.sub(r'\*(.*?)\*', r'\1', content)  # Remove italics
        
        # Remove bullet points but keep items
        content = re.sub(r'^[•\-*]\s*', '- ', content, flags=re.MULTILINE)
        
        # Remove URLs
        content = re.sub(r'https?://\S+', '[URL]', content)
        
        # Remove examples if they're long
        lines = content.split('\n')
        cleaned_lines = []
        in_example = False
        
        for line in lines:
            lower = line.lower()
            if any(keyword in lower for keyword in ['example:', 'for example:', 'e.g.', 'such as:']):
                in_example = True
                # Keep the label but truncate the example
                cleaned_lines.append(line.split(':')[0] + ': [Example provided]')
            elif in_example and line.strip() == '':
                in_example = False
                cleaned_lines.append(line)
            elif not in_example:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    @staticmethod
    def _aggressive_compress(content: str, target_tokens: int) -> str:
        """Apply aggressive compression techniques"""
        
        # Strategy 1: Extract key sentences
        sentences = re.split(r'[.!?]+', content)
        
        # Keep first 3 sentences (intro), then sample
        if len(sentences) > 10:
            important = sentences[:3]  # Beginning
        
            # Sample middle (every 3rd sentence)
            middle_start = 3
            middle_end = min(len(sentences) - 3, 20)  # Don't go too far
            for i in range(middle_start, middle_end, 3):
                if i < len(sentences):
                    important.append(sentences[i])
            
            # Keep last 2 sentences (conclusion)
            important.extend(sentences[-3:])
            
            compressed = '. '.join([s.strip() for s in important if s.strip()]) + '.'
        else:
            compressed = content
        
        # Strategy 2: Summarize long paragraphs
        paragraphs = compressed.split('\n\n')
        compressed_paragraphs = []
        
        for para in paragraphs:
            if ContentCompressor.estimate_tokens(para) > 200:
                # Summarize long paragraphs
                sentences = para.split('. ')
                if len(sentences) > 3:
                    # Keep first, middle, last
                    summary = sentences[0] + '. '
                    if len(sentences) > 1:
                        summary += sentences[len(sentences)//2] + '. '
                    summary += sentences[-1] + '.'
                    compressed_paragraphs.append(summary)
                else:
                    compressed_paragraphs.append(para)
            else:
                compressed_paragraphs.append(para)
        
        compressed = '\n\n'.join(compressed_paragraphs)
        
        # Strategy 3: Truncate if still too long
        current_tokens = ContentCompressor.estimate_tokens(compressed)
        if current_tokens > target_tokens:
            # Calculate characters to keep (approx 3 chars per token)
            chars_to_keep = target_tokens * 3
            if len(compressed) > chars_to_keep:
                # Keep beginning and end
                split = chars_to_keep // 2
                compressed = compressed[:split] + "\n\n...\n\n" + compressed[-split:]
        
        return compressed
    
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """More accurate token estimation"""
        # English text: ~0.75 words per token OR ~4 chars per token
        # Use the larger estimate to be safe
        word_count = len(text.split())
        char_count = len(text)
        
        tokens_by_words = int(word_count / 0.75)  # ~1.33 tokens per word
        tokens_by_chars = int(char_count / 3.5)   # ~3.5 chars per token
        
        # Return the average, but ensure at least some tokens
        estimated = int((tokens_by_words + tokens_by_chars) / 2)
        return max(estimated, 10)  # Never return 0 or very small numbers