# Number Discussion System 🔢

A unique social platform where people communicate through numbers and mathematical operations instead of text.

## Concept

In this system:
- **Discussion** = A starting number that begins a computation tree (like a Twitter post)
- **Operation** = A mathematical operation (ADD, SUBTRACT, MULTIPLY, DIVIDE) applied to a number, creating a new result (like a comment/reply)
- **Computation Tree** = All operations branching from a starting number, forming discussion threads

### How it Works

1. A user creates a **Discussion** by choosing a starting number (e.g., `42`)
2. Other users respond by choosing an **Operation** and a number:
   - `ADD 10` → Result: 52
   - `MULTIPLY 2` → Result: 84
   - `DIVIDE 7` → Result: 6
3. Users can respond to any result, creating branching computation trees
4. Each operation stores: the operation type, the operand (right-side number), and the computed result

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing

## Quickstart
