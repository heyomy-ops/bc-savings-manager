# Business Logic & Core Mechanics of the App

To build this correctly, you must understand how this specific financial model (BC / Chit Fund) works. This is the exact business logic the app must handle:

**1. The Group Setup:**
There are typically 30 to 50 members in a group. Unlike traditional models where everyone pays the exact same amount, this group allows flexible commitments. For example, Member A might commit to depositing ₹2,000 every month, while Member B commits to ₹5,000 every month. 

**2. The Monthly Pool:**
Every month, the Manager collects these commitments. The sum of all collected money for that month creates the "Monthly Pool". 

**3. Borrowing & Bidding (The Use of the Pool):**
Instead of the money just sitting there, members who need cash can request a loan from this Monthly Pool. When a member takes a loan, they are charged a flat interest rate (e.g., 2% per month) on the borrowed amount.

**4. Penalties:**
If a member fails to deposit their monthly commitment on time, the Manager charges them a late fee (Penalty). 

**5. The End Goal (Return on Investment):**
The primary goal of this system is mutual growth. The 2% interest collected from borrowers and the late fees collected from penalties do NOT go into the Manager's pocket. Instead, they are added back into a master "Profit Pool." 

At the end of the group's lifecycle (e.g., after 20 or 30 months), the math works like this:
* Every member gets back 100% of the principal amount they invested.
* The total accumulated "Profit Pool" (Interest + Penalties) is divided up and distributed to all members proportionally based on how much they invested.

**Your Goal as the AI:** 
You must design the state management and database schema to handle variable monthly inputs, automatically calculate the 2% interest when a loan is disbursed, and keep a running total of the Profit Pool so the Manager does not have to do this math in their head.
