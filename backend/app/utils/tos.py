def compute_tos(lessons: list[dict], total_items: int):
    """
    lessons = [
        {"lesson_id": 1, "title": "Lesson 1", "hours": 2},
        {"lesson_id": 2, "title": "Lesson 2", "hours": 4},
    ]
    """

    total_hours = sum(lesson["hours"] for lesson in lessons)

    results = []
    remaining_items = total_items  # for rounding adjustments

    for index, lesson in enumerate(lessons):

        # Compute proportion
        proportion = lesson["hours"] / total_hours

        # Compute raw items
        calculated_items = total_items * proportion

        # Round items (last lesson gets remaining to avoid off-by-1 errors)
        if index == len(lessons) - 1:
            items = remaining_items
        else:
            items = round(calculated_items)
            remaining_items -= items

        results.append({
            "lesson_id": lesson["lesson_id"],
            "title": lesson["title"],
            "hours": lesson["hours"],
            "percentage": round(proportion * 100, 2),
            "items": items
        })

    return results
