const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const Course = require("../models/Course");
const Instructor = require("../models/Instructor");
const Event = require("../models/Event");
const Slide = require("../models/Slide");
const pool = require("../db/connection");

// -------------------- PUBLIC READ --------------------
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.getAll();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/courses/featured", async (req, res) => {
  try {
    const courses = await Course.getFeatured();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Not found" });
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// Instructors endpoint - returns instructors from both instructors table and users table (role=INSTRUCTOR)
router.get("/instructors", async (req, res) => {
  try {
    // Get instructors ONLY from instructors table (not from users table)
    let instructors = [];
    try {
      instructors = await Instructor.getAll();
      console.log(`Found ${instructors.length} instructors from instructors table`);
    } catch (instructorError) {
      console.warn("Error loading from instructors table (table might not exist):", instructorError.message);
      // Continue even if instructors table doesn't exist
    }
    
    // DISABLED: Get instructors from users table (role=INSTRUCTOR)
    // Only use instructors from instructors table to avoid duplicates
    let userInstructors = [];
    
    // Skip loading from users table - only use instructors table
    if (false) { // Disabled: was loading from users table
    try {
      // Create a set of instructor names for duplicate checking (case-insensitive)
      const instructorNames = new Set(
        instructors.map(i => {
          const name = (i.name || '').toLowerCase().trim();
          // Also check first name + last name combinations
          const parts = name.split(/\s+/);
          return name;
        })
      );
      
      // Get all instructors from users table (role=INSTRUCTOR)
      let instructorsResult = await pool.query(
        `SELECT 
          u.user_id as instructor_id,
          TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) as name,
          u.name as first_name,
          u.surname as last_name,
          u.email,
          CASE 
            WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN 'Advisor Instructor'
            ELSE 'Instructor'
          END as title,
          COALESCE(u.email, '') as email_for_bio,
          CASE WHEN EXISTS (SELECT 1 FROM students WHERE advisor_instructor_id = u.user_id) THEN true ELSE false END as is_advisor_instructor
         FROM users u
         WHERE LOWER(u.role) = 'instructor' AND (u.is_active = true OR u.is_active IS NULL)
         ORDER BY u.name, u.surname`
      );
      
      if (instructorsResult.rows.length > 0) {
        userInstructors = instructorsResult.rows;
        console.log(`Found ${userInstructors.length} instructors from users table (role=INSTRUCTOR)`);
      }
      
      // Remove any entries with empty names
      userInstructors = userInstructors.filter(t => t.name && t.name.trim() !== '');
      
      // Create a more comprehensive set of instructor names for duplicate checking
      const instructorNameVariations = new Set();
      instructors.forEach(inst => {
        const instName = (inst.name || '').toLowerCase().trim();
        instructorNameVariations.add(instName);
        // Add name parts
        const parts = instName.split(/\s+/);
        parts.forEach(part => {
          if (part.length > 2) instructorNameVariations.add(part);
        });
        // Add combinations
        if (parts.length >= 2) {
          instructorNameVariations.add(`${parts[0]} ${parts[parts.length - 1]}`);
        }
      });
      
      // Remove user instructors that already exist in instructors table (by name matching)
      userInstructors = userInstructors.filter(t => {
        const instructorName = (t.name || '').toLowerCase().trim();
        const firstName = (t.first_name || '').toLowerCase().trim();
        const lastName = (t.last_name || '').toLowerCase().trim();
        
        // Check exact match
        if (instructorNameVariations.has(instructorName)) {
          return false;
        }
        
        // Check if any instructor name contains this instructor's full name or parts
        for (const instructor of instructors) {
          const instName = (instructor.name || '').toLowerCase().trim();
          // Exact match
          if (instName === instructorName) {
            return false;
          }
          // Check if instructor name contains instructor's first and last name
          if (instName.includes(firstName) && instName.includes(lastName)) {
            return false;
          }
          // Check reverse - if instructor name contains instructor name parts
          const instParts = instName.split(/\s+/);
          if (instParts.length >= 2 && instructorName.includes(instParts[0]) && instructorName.includes(instParts[instParts.length - 1])) {
            return false;
          }
        }
        
        return true;
      });
      
      // Add image and bio to user instructors
      // Track which images are already used by instructors to avoid duplicates
      const allImageOptions = ['instructor-01.jpg', 'instructor-02.jpg', 'instructor-03.jpg', 'instructor-04.jpg', 'instructor-05.jpg', 'instructor-06.jpg'];
      
      // Get images already used by instructors
      const usedImages = new Set(
        instructors
          .map(inst => inst.image)
          .filter(img => img && allImageOptions.includes(img))
      );
      
      // Get available images (not used by instructors)
      const availableImages = allImageOptions.filter(img => !usedImages.has(img));
      
      // If all images are used, use all images (will have duplicates, but better than nothing)
      const imagePool = availableImages.length > 0 ? availableImages : allImageOptions;
      
      // Track which images we've assigned to user instructors in this batch
      const assignedImages = new Set();
      let imageIndex = 0;
      
      userInstructors = userInstructors.map((instructor, index) => {
        // Assign images sequentially to ensure uniqueness
        // If we run out of unique images, cycle through the pool
        let assignedImage;
        if (imageIndex < imagePool.length) {
          assignedImage = imagePool[imageIndex];
          assignedImages.add(assignedImage);
          imageIndex++;
        } else {
          // Cycle through available images if we have more instructors than images
          const cycleIndex = (index - imagePool.length) % imagePool.length;
          assignedImage = imagePool[cycleIndex];
        }
        
        const bio = instructor.is_advisor_instructor 
          ? `Experienced advisor instructor at EasyGoing Education, dedicated to student success and academic excellence.`
          : `Experienced instructor at EasyGoing Education, passionate about sharing knowledge and helping students achieve their goals.`;
        
        return {
          ...instructor,
          image: assignedImage,
          bio: bio,
          social_links: null
        };
      });
      
      console.log(`After filtering, ${userInstructors.length} valid instructors from users table (excluding duplicates from instructors table)`);
      
    } catch (instructorError) {
      console.error("Error loading instructors from users table:", instructorError);
      console.error("Error details:", instructorError.message);
      // Continue with instructors only
    }
    } // End of disabled users table loading
    
    // Use ONLY instructors from instructors table (no users table merging)
    // Simply use the instructors array directly
    let allInstructors = instructors;
    
    console.log(`Total unique instructors to return: ${allInstructors.length}`);
    
    // Assign unique images to all instructors
    // Ensure no duplicate images are used
    // BUT: If instructor already has an image, use that instead
    const allImageOptions = ['instructor-01.jpg', 'instructor-02.jpg', 'instructor-03.jpg', 'instructor-04.jpg', 'instructor-05.jpg', 'instructor-06.jpg'];
    const usedImages = new Set();
    let imageIndex = 0;
    
    // First, collect all images that are already assigned (from database)
    allInstructors.forEach(inst => {
      if (inst.image && inst.image.trim()) {
        usedImages.add(inst.image);
      }
    });
    
    // Assign images sequentially to ensure uniqueness
    allInstructors = allInstructors.map((inst, index) => {
      // If instructor already has an image, use it
      if (inst.image && inst.image.trim()) {
        return {
          ...inst,
          image: inst.image
        };
      }
      
      // Otherwise, assign a unique image from the pool
      let assignedImage;
      
      // Try to assign a unique image from the pool
      if (imageIndex < allImageOptions.length) {
        assignedImage = allImageOptions[imageIndex];
        usedImages.add(assignedImage);
        imageIndex++;
      } else {
        // If we've used all images, cycle through them
        // But try to avoid immediate duplicates by using a different pattern
        const cycleIndex = (index - allImageOptions.length) % allImageOptions.length;
        // Use a different offset to avoid immediate duplicates
        const offset = Math.floor((index - allImageOptions.length) / allImageOptions.length);
        const finalIndex = (cycleIndex + offset) % allImageOptions.length;
        assignedImage = allImageOptions[finalIndex];
      }
      
      return {
        ...inst,
        image: assignedImage
      };
    });
    
    // Sort by name
    allInstructors.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    res.json(allInstructors);
  } catch (e) {
    console.error("GET /instructors error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get("/instructors/:id", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: "Not found" });
    res.json(instructor);
  } catch (e) {
    console.error("GET /instructors/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/events", async (req, res) => {
  try {
    const events = await Event.getAll();
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Not found" });
    res.json(event);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/slides", async (req, res) => {
  try {
    const slides = await Slide.getAll();
    res.json(slides);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/slides/:id", async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id);
    if (!slide) return res.status(404).json({ message: "Not found" });
    res.json(slide);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- ADMIN/MANAGER MANAGE --------------------
const adminOnly = [authenticateToken, requireRoles("ADMIN")];
const adminOrManager = [authenticateToken, requireRoles("ADMIN", "MANAGER")];

// COURSES
router.post("/courses", ...adminOnly, async (req, res) => {
  try {
    const { title, description, duration, price, level, image, is_featured } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    const created = await Course.create({ title, description, duration, price, level, image, is_featured: !!is_featured });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/courses/:id", ...adminOnly, async (req, res) => {
  try {
    const updated = await Course.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/courses/:id", ...adminOnly, async (req, res) => {
  try {
    await Course.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// INSTRUCTORS
router.post("/instructors", ...adminOnly, async (req, res) => {
  try {
    const { name, title, bio, image, social_links } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });
    const created = await Instructor.create({ name, title, bio, image, social_links });
    res.status(201).json(created);
  } catch (e) {
    console.error("POST /instructors error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/instructors/:id", ...adminOnly, async (req, res) => {
  try {
    const updated = await Instructor.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    console.error("PUT /instructors/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/instructors/:id", ...adminOnly, async (req, res) => {
  try {
    await Instructor.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /instructors/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// EVENTS
router.post("/events", ...adminOrManager, async (req, res) => {
  try {
    const { title, time, location, image } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    const created = await Event.create({ title, time, location, image });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/events/:id", ...adminOrManager, async (req, res) => {
  try {
    const updated = await Event.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/events/:id", ...adminOrManager, async (req, res) => {
  try {
    await Event.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// SLIDES
router.post("/slides", ...adminOrManager, async (req, res) => {
  try {
    const { title, description, image } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    const created = await Slide.create({ title, description, image });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/slides/:id", ...adminOrManager, async (req, res) => {
  try {
    const updated = await Slide.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/slides/:id", ...adminOrManager, async (req, res) => {
  try {
    await Slide.delete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
