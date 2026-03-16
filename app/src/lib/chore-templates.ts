export type ChoreTemplate = {
  title: string;
  description: string;
  dollarValue: number;
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  recurrence: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";
  categoryIcon: string;
};

export type ChoreTemplatePack = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  ageRange: string;
  chores: ChoreTemplate[];
};

export const CHORE_TEMPLATE_PACKS: ChoreTemplatePack[] = [
  {
    id: "young-kids",
    name: "Young Kids Starter",
    description: "Simple daily tasks for ages 5-7",
    emoji: "\u{1F9D2}",
    ageRange: "5-7",
    chores: [
      { title: "Make Your Bed", description: "Pull up covers and arrange pillows", dollarValue: 0.50, estimatedMinutes: 5, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F6CF}\uFE0F" },
      { title: "Put Away Toys", description: "Clean up toys from the play area", dollarValue: 0.50, estimatedMinutes: 10, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F9F8}" },
      { title: "Feed the Pet", description: "Fill food and water bowls", dollarValue: 0.75, estimatedMinutes: 5, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F43E}" },
      { title: "Set the Table", description: "Put plates, cups, and utensils on the table", dollarValue: 0.50, estimatedMinutes: 5, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F37D}\uFE0F" },
      { title: "Water the Plants", description: "Water indoor plants", dollarValue: 0.50, estimatedMinutes: 5, difficulty: "EASY", recurrence: "WEEKLY", categoryIcon: "\u{1F331}" },
      { title: "Pick Up Clothes", description: "Put dirty clothes in the hamper", dollarValue: 0.25, estimatedMinutes: 3, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F455}" },
    ],
  },
  {
    id: "middle-kids",
    name: "Growing Up",
    description: "More responsibility for ages 8-10",
    emoji: "\u{1F9D1}",
    ageRange: "8-10",
    chores: [
      { title: "Vacuum a Room", description: "Vacuum the living room or bedroom", dollarValue: 1.50, estimatedMinutes: 15, difficulty: "MEDIUM", recurrence: "WEEKLY", categoryIcon: "\u{1F9F9}" },
      { title: "Load Dishwasher", description: "Rinse and load dishes after dinner", dollarValue: 1.00, estimatedMinutes: 10, difficulty: "MEDIUM", recurrence: "DAILY", categoryIcon: "\u{1F37D}\uFE0F" },
      { title: "Take Out Trash", description: "Take trash bags to the outdoor bin", dollarValue: 0.75, estimatedMinutes: 5, difficulty: "EASY", recurrence: "DAILY", categoryIcon: "\u{1F5D1}\uFE0F" },
      { title: "Fold Laundry", description: "Fold clean clothes and put them away", dollarValue: 1.50, estimatedMinutes: 15, difficulty: "MEDIUM", recurrence: "WEEKLY", categoryIcon: "\u{1F455}" },
      { title: "Clean Bathroom Sink", description: "Wipe down the bathroom sink and mirror", dollarValue: 1.25, estimatedMinutes: 10, difficulty: "MEDIUM", recurrence: "WEEKLY", categoryIcon: "\u{1FAA5}" },
      { title: "Sweep Kitchen Floor", description: "Sweep the kitchen floor after meals", dollarValue: 1.00, estimatedMinutes: 10, difficulty: "MEDIUM", recurrence: "DAILY", categoryIcon: "\u{1F9F9}" },
      { title: "Organize Bookshelf", description: "Straighten up books and materials", dollarValue: 1.00, estimatedMinutes: 10, difficulty: "EASY", recurrence: "WEEKLY", categoryIcon: "\u{1F4DA}" },
    ],
  },
  {
    id: "tweens",
    name: "Tween Tasks",
    description: "Real household contributions for ages 11-13",
    emoji: "\u{1F9D1}\u200D\u{1F393}",
    ageRange: "11-13",
    chores: [
      { title: "Mow the Lawn", description: "Mow front and back yard", dollarValue: 5.00, estimatedMinutes: 45, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F33F}" },
      { title: "Do Laundry", description: "Wash, dry, fold, and put away a load", dollarValue: 3.00, estimatedMinutes: 20, difficulty: "MEDIUM", recurrence: "WEEKLY", categoryIcon: "\u{1F9FA}" },
      { title: "Cook a Simple Meal", description: "Prepare lunch or a simple dinner", dollarValue: 3.50, estimatedMinutes: 30, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F373}" },
      { title: "Clean the Bathroom", description: "Full bathroom clean: toilet, sink, tub, floor", dollarValue: 4.00, estimatedMinutes: 25, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F6BF}" },
      { title: "Wash the Car", description: "Wash and dry the family car", dollarValue: 5.00, estimatedMinutes: 30, difficulty: "HARD", recurrence: "MONTHLY", categoryIcon: "\u{1F697}" },
      { title: "Walk the Dog", description: "Take the dog for a 20-minute walk", dollarValue: 2.00, estimatedMinutes: 20, difficulty: "MEDIUM", recurrence: "DAILY", categoryIcon: "\u{1F415}" },
      { title: "Rake Leaves", description: "Rake and bag leaves in the yard", dollarValue: 4.00, estimatedMinutes: 40, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F342}" },
      { title: "Unload Groceries", description: "Help bring in and put away groceries", dollarValue: 1.50, estimatedMinutes: 15, difficulty: "EASY", recurrence: "WEEKLY", categoryIcon: "\u{1F6D2}" },
    ],
  },
  {
    id: "teens",
    name: "Teen Responsibilities",
    description: "Serious tasks for ages 14+",
    emoji: "\u{1F9D1}\u200D\u{1F4BC}",
    ageRange: "14+",
    chores: [
      { title: "Deep Clean Kitchen", description: "Clean counters, appliances, floor, organize cabinets", dollarValue: 7.00, estimatedMinutes: 45, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F373}" },
      { title: "Babysit Siblings", description: "Watch younger siblings for an hour", dollarValue: 5.00, estimatedMinutes: 60, difficulty: "HARD", recurrence: "ONCE", categoryIcon: "\u{1F476}" },
      { title: "Meal Prep", description: "Prepare ingredients or meals for the week", dollarValue: 5.00, estimatedMinutes: 45, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F957}" },
      { title: "Organize Garage", description: "Clean and organize the garage", dollarValue: 10.00, estimatedMinutes: 60, difficulty: "HARD", recurrence: "MONTHLY", categoryIcon: "\u{1F527}" },
      { title: "Mop All Floors", description: "Mop kitchen, bathroom, and hallway floors", dollarValue: 4.00, estimatedMinutes: 30, difficulty: "MEDIUM", recurrence: "WEEKLY", categoryIcon: "\u{1F9F9}" },
      { title: "Yard Work", description: "Weeding, trimming, general yard maintenance", dollarValue: 6.00, estimatedMinutes: 45, difficulty: "HARD", recurrence: "WEEKLY", categoryIcon: "\u{1F33F}" },
    ],
  },
  {
    id: "seasonal",
    name: "Seasonal Specials",
    description: "Holiday and seasonal chores",
    emoji: "\u{1F384}",
    ageRange: "All ages",
    chores: [
      { title: "Decorate for Holidays", description: "Help put up seasonal decorations", dollarValue: 3.00, estimatedMinutes: 30, difficulty: "MEDIUM", recurrence: "ONCE", categoryIcon: "\u{1F384}" },
      { title: "Spring Cleaning", description: "Deep clean your room top to bottom", dollarValue: 5.00, estimatedMinutes: 45, difficulty: "HARD", recurrence: "ONCE", categoryIcon: "\u{1F338}" },
      { title: "Shovel Snow", description: "Shovel the driveway and walkways", dollarValue: 5.00, estimatedMinutes: 30, difficulty: "HARD", recurrence: "ONCE", categoryIcon: "\u2744\uFE0F" },
      { title: "Garden Planting", description: "Help plant flowers or vegetables", dollarValue: 3.00, estimatedMinutes: 30, difficulty: "MEDIUM", recurrence: "ONCE", categoryIcon: "\u{1F33B}" },
    ],
  },
];
