def compute_tos(lessons: list[dict], total_items: int):
    """
    Fixed version using largest remainder method for fair distribution
    """
    total_hours = sum(lesson["hours"] for lesson in lessons)
    
    if total_hours == 0:
        return []
    
    # Calculate base allocation and remainders
    base_allocations = []
    remainders = []
    
    for lesson in lessons:
        proportion = lesson["hours"] / total_hours
        exact = total_items * proportion
        base = int(exact)  # Floor value
        remainder = exact - base  # Decimal part
        
        base_allocations.append(base)
        remainders.append(remainder)
    
    # Start with base allocations
    items_per_lesson = base_allocations.copy()
    total_allocated = sum(base_allocations)
    
    # Distribute remaining items by largest remainder
    remaining = total_items - total_allocated
    
    if remaining > 0:
        # Sort by remainder (largest first)
        sorted_indices = sorted(
            range(len(remainders)), 
            key=lambda i: remainders[i], 
            reverse=True
        )
        
        # Give one extra item to lessons with largest remainders
        for i in range(remaining):
            idx = sorted_indices[i]
            items_per_lesson[idx] += 1
    
    # Build results
    results = []
    for i, lesson in enumerate(lessons):
        proportion = lesson["hours"] / total_hours
        results.append({
            "lesson_id": lesson["lesson_id"],
            "title": lesson["title"],
            "hours": lesson["hours"],
            "percentage": round(proportion * 100, 2),
            "items": items_per_lesson[i]
        })
    
    return results