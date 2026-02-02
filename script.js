const SCHOLARSHIPS_SHEET_ID = "1sfVjLdfJOFRxypFi1rHpDDulk0525u0SQK89_-_b5OM";
const RESOURCES_SHEET_ID = "1ZT0ZYqoTlE-NOYZVRPMtHxoubZm-1GrMUzj2w02CI0I";

const SCHOLARSHIPS_URL = `https://opensheet.elk.sh/${SCHOLARSHIPS_SHEET_ID}/1`;
const RESOURCES_URL = `https://opensheet.elk.sh/${RESOURCES_SHEET_ID}/1`;

const collegeHelpResources = [
  {
    title: "California Student Aid Commission - Financial Aid Programs",
    url: "https://www.csac.ca.gov/financial-aid-programs",
  },
  {
    title: "Federal Student Aid - Types of Aid",
    url: "https://studentaid.gov/understand-aid/types",
  },
  {
    title: "Common App - First Year Students",
    url: "https://www.commonapp.org/apply/first-year-students",
  },
  {
    title: "University of California - How to Apply",
    url: "https://admission.universityofcalifornia.edu/how-to-apply/",
  },
  {
    title: "College Board - How to Begin College Applications",
    url: "https://bigfuture.collegeboard.org/plan-for-college/apply-to-college/college-applications-how-to-begin",
  },
  {
    title: "U.S. News - College Application Process",
    url: "https://www.usnews.com/education/best-colleges/articles/college-application-process",
  },
  {
    title: "Xello Resources - Guides ready to download",
    url: "https://help.xello.world/en-us/Content/Knowledge-Base/Xello-6-12/College-Planning/CA_Complete-Teacher-Eval.htm",
  },
  {
    title: "Xello College Planning Resources",
    url: "https://help.xello.world/en-us/Content/Knowledge-Base/Xello-6-12/College-Planning/KB_6-12_College-Planning.htm",
  },
  { 
    title: "OnePrep: Your Ultimate SAT Site - practice problems, full-lenght tests, module practice, vocab and more!",
    url: "https://www.oneprep.xyz/",
},
  {
  title: "College Admissions Hacks: A Field Guide",
  url: "https://docs.google.com/document/d/1OxLEGNu_7_v1kcZp4KCX13YF_GFzaM6oLvneZuAa1Ck/edit?mcp_token=eyJwaWQiOjE4MjY5NTcsInNpZCI6MTk3MzIwMzM0LCJheCI6ImVmYTQ0NWMyNmUyN2U2ZjQ0MTVlNzkxYmE0Y2ViOTVhIiwidHMiOjE3NjQ1MzIzNzcsImV4cCI6MTc2Njk1MTU3N30.EiAiGZPApFT_8RlExocMM-ZFXXEZlZTrU7D8jCD5LK0&tab=t.0#heading=h.w6k2brq4o8pc",
  },
  {
    title: "SAT + ACT Master Document!",
    url: "https://api.drived.space/uploads/drived/315/download/pdf/5a/k6/chchnk0ql.pdf?_gl=1*cnqmzm*_ga*MjI0MTU1MzY5LjE3NjIzMTQzNTY.*_ga_L2M0FH0HF9*czE3NjIzMTQzNTUkbzEkZzEkdDE3NjIzMTQzODUkajMwJGwwJGgw",
  },
  {
    title: "Khan Academy: SAT Prep",
    url: "https://www.khanacademy.org/test-prep/digital-sat",
  },
    ];

let allScholarships = [];
let allOpportunities = [];

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const content = document.getElementById("content");

  function setActiveTab(tab) {
    buttons.forEach((btn) => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  function loadSection(type) {
    setActiveTab(type);
    content.innerHTML = "<p>Loading...</p>";

    if (type === "college") {
      const resourceCards = collegeHelpResources.map(resource => `
        <div class="resource-card">
          ${resource.image ? `<img class="resource-image" src="${resource.image}" alt="${resource.title}" onerror="this.style.display='none'"/>` : ""}
          <div class="card-info">
            <h3>${resource.title}</h3>
            <a href="${resource.url}" target="_blank">Visit Resource</a>
          </div>
        </div>
      `).join("");

      content.innerHTML = `
        <div class="resource-card">
          <div class="card-info">
            <h3>Franklin High School Newspaper</h3>
            <p>Visit our school newspaper for the latest news, college help, and guides!(coming soon)</p>
            <a href="https://fhsbuzz.com/" target="_blank">Visit FHS Buzz</a>
          </div>
        </div>
        ${resourceCards}
      `;
    } else if (type === "opportunities") {
      fetch(RESOURCES_URL)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Opportunities data loaded:", data);
          if (data && data.length > 0) {
            console.log("First opportunity item:", data[0]);
            console.log("Keys in first item:", Object.keys(data[0]));
          }
          if (!data || data.length === 0) {
            content.innerHTML = "<p>No opportunities found.</p>";
          } else {
            allOpportunities = data;
            renderOpportunitiesWithSearch();
          }
        })
        .catch((error) => {
          console.error("Error loading opportunities:", error);
          content.innerHTML =
            "<p>Error loading opportunities. Please check that the Google Sheet is publicly accessible.</p>";
        });
    } else if (type === "scholarships") {
      fetch(SCHOLARSHIPS_URL)
        .then((response) => response.json())
        .then((data) => {
          if (!data || data.length === 0) {
            content.innerHTML = "<p>No scholarships found.</p>";
          } else {
            allScholarships = data;
            renderScholarshipsWithSearch();
          }
        })
        .catch((error) => {
          console.error("Error loading scholarships:", error);
          content.innerHTML =
            "<p>Error loading scholarships. Please try again later.</p>";
        });
    }
  }

  function renderScholarshipsWithSearch() {
    content.innerHTML = `
      <div class="search-container">
        <input 
          type="text" 
          id="scholarship-search" 
          class="search-input" 
          placeholder="Search scholarships by name..."
        />
      </div>
      <div id="scholarship-results"></div>
    `;

    renderScholarshipCards(allScholarships);

    const searchInput = document.getElementById("scholarship-search");
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allScholarships.filter((item) => {
        const normalizedItem = normalizeItem(item);
        const title = getTitle(normalizedItem);
        return title.toLowerCase().includes(query);
      });
      renderScholarshipCards(filtered);
    });
  }

  function renderScholarshipCards(items) {
    const resultsDiv = document.getElementById("scholarship-results");
    if (!resultsDiv) return;

    const cardsHTML = items
      .map((item) => {
        const normalizedItem = normalizeItem(item);
        const title = getTitle(normalizedItem);
        const description = getDescription(normalizedItem);
        const link = getLink(normalizedItem);
        const deadline = getDeadline(normalizedItem);
        const status = normalizedItem.Status || "";
        const image = normalizedItem.Image || normalizedItem.image || "";
        const emoji = normalizedItem.Emoji || normalizedItem.emoji || "";
        const area =
          normalizedItem.Area ||
          normalizedItem.area ||
          normalizedItem.Category ||
          normalizedItem.category ||
          "";
        const grade =
          normalizedItem.Grade ||
          normalizedItem.grade ||
          normalizedItem["Grade Level"] ||
          "";

        return `
        <div class="resource-card">
          ${image ? `<img class="resource-image" src="${image}" alt="${title}" onerror="this.style.display='none'"/>` : ""}
          <div class="card-emoji">${emoji}</div>
          <div class="card-info">
            <h3>${title}</h3>
            ${description ? `<p>${description}</p>` : ""}
            <ul>
              ${status ? `<li><strong>Status:</strong> ${status}</li>` : ""}
              ${area ? `<li><strong>Area:</strong> ${area}</li>` : ""}
              ${grade ? `<li><strong>Grade Level:</strong> ${grade}</li>` : ""}
              ${deadline ? `<li><strong>Deadline:</strong> ${deadline}</li>` : ""}
            </ul>
            ${link ? `<a href="${link}" target="_blank">Apply / Visit</a>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    resultsDiv.innerHTML = cardsHTML || "<p>No scholarships match your search.</p>";
  }

  function renderOpportunitiesWithSearch() {
    content.innerHTML = `
      <div class="search-container">
        <input 
          type="text" 
          id="opportunity-search" 
          class="search-input" 
          placeholder="Search opportunities by name or category (e.g., STEM, Arts)..."
        />
      </div>
      <div id="opportunity-results"></div>
    `;

    renderOpportunityCards(allOpportunities);

    const searchInput = document.getElementById("opportunity-search");
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allOpportunities.filter((item) => {
        const normalizedItem = normalizeItem(item);
        const name = getName(normalizedItem);
        const category = getCategory(normalizedItem);
        return (
          name.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        );
      });
      renderOpportunityCards(filtered);
    });
  }

  function renderOpportunityCards(items) {
    const resultsDiv = document.getElementById("opportunity-results");
    if (!resultsDiv) return;

    const cardsHTML = items
      .map((item, index) => {
        const normalizedItem = normalizeItem(item);
        const name = getName(normalizedItem);
        const status = normalizedItem.Status || normalizedItem.status || "";
        const notes = getNotes(normalizedItem);
        const deadline = getDeadline(normalizedItem);
        const category = getCategory(normalizedItem);
        const link = getLink(normalizedItem);
        
        const hasTitle = normalizedItem.title || normalizedItem.Title || normalizedItem.name || normalizedItem.Name;
        const displayTitle = hasTitle ? name : `Untitled Opportunity #${index + 1}${notes ? ": " + notes.substring(0, 40) + (notes.length > 40 ? "..." : "") : ""}`;

        return `
        <div class="resource-card">
          <div class="card-info">
            <h3>${displayTitle}</h3>
            ${notes && hasTitle ? `<p>${notes}</p>` : ""}
            <ul>
              ${status ? `<li><strong>Status:</strong> ${status}</li>` : ""}
              ${category ? `<li><strong>Category:</strong> ${category}</li>` : ""}
              ${deadline ? `<li><strong>Deadline:</strong> ${deadline}</li>` : ""}
              </ul>
            ${link ? `<a href="${link}" target="_blank">Apply / Visit</a>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    resultsDiv.innerHTML = cardsHTML || "<p>No opportunities match your search.</p>";
  }

  function normalizeItem(item) {
    const normalized = {};
    Object.keys(item).forEach((key) => {
      const trimmedKey = key.trim();
      const trimmedValue =
        typeof item[key] === "string" ? item[key].trim() : item[key];
      normalized[trimmedKey] = trimmedValue;
    });
    return normalized;
  }

  function getTitle(item) {
    return (
      item.Title ||
      item.title ||
      item.Name ||
      item.name ||
      item.Task ||
      "Untitled"
    );
  }

  function getName(item) {
    const name = item.name || item.Name || item.title || item.Title || item.Task || item.task || "";
    if (!name) {
      console.log("No name found for item:", item);
      console.log("Available keys:", Object.keys(item));
    }
    return name || "Untitled Opportunity";
  }

  function getDescription(item) {
    return (
      item.Desc ||
      item.description ||
      item.Notes ||
      item.Description ||
      ""
    );
  }

  function getNotes(item) {
    return (
      item.Notes ||
      item.notes ||
      item.Description ||
      item.description ||
      ""
    );
  }

  function getLink(item) {
    return (
      item.Link ||
      item.link ||
      item.URL ||
      item.url ||
      ""
    );
  }

  function getDeadline(item) {
    return (
      item.Deadline ||
      item.deadline ||
      item["Due date"] ||
      item.DueDate ||
      item.Date ||
      ""
    );
  }

  function getCategory(item) {
    return (
      item.Category ||
      item.category ||
      item.Area ||
      item.area ||
      ""
    );
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      loadSection(btn.dataset.tab);
    });
  });

  loadSection("college");
});
