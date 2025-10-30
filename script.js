// 初始化变量
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meal-details");
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");

// API URL设置
const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`; // 根据菜名搜索菜单
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`; // 根据菜单ID搜索详情

// 设置事件监听器
searchBtn.addEventListener("click", searchMeals);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMeals();
});
mealsContainer.addEventListener("click", handleMealClick);
backBtn.addEventListener("click", () => mealDetails.classList.add("hidden"));

// 搜索菜单的方法
async function searchMeals() {
  const searchTerm = searchInput.value.trim();
  
  // 处理空输入的情况
  if (!searchTerm) {
    errorContainer.textContent = "请输入搜索关键词";
    errorContainer.classList.remove("hidden");
    return;
  }
  
  try {
    // 显示搜索中状态
    resultHeading.textContent = `正在搜索 "${searchTerm}"...`;
    mealsContainer.innerHTML = "";
    errorContainer.classList.add("hidden");

    // 从API获取数据
    const response = await fetch(`${SEARCH_URL}${searchTerm}`);
    const data = await response.json();

    if (data.meals === null) {
      // 没有找到结果
      resultHeading.textContent = ``;
      mealsContainer.innerHTML = "";
      errorContainer.textContent = `没有找到关于 "${searchTerm}" 的菜谱。请尝试其他关键词！`;
      errorContainer.classList.remove("hidden");
    } else {
      // 显示搜索结果
      resultHeading.textContent = `"${searchTerm}" 的搜索结果：`;
      displayMeals(data.meals);
      searchInput.value = "";
      
      // 将最近的搜索保存到本地存储
      localStorage.setItem('lastSearch', JSON.stringify({
        term: searchTerm,
        results: data.meals,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error("搜索错误:", error);
    errorContainer.textContent = "出错了，请稍后再试。";
    errorContainer.classList.remove("hidden");
  }
}

// 显示菜单列表
function displayMeals(meals) {
  mealsContainer.innerHTML = "";
  
  // 遍历菜单列表，为每个菜单项创建卡片
  meals.forEach((meal) => {
    mealsContainer.innerHTML += `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3 class="meal-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
        </div>
      </div>
    `;
  });
}

// 处理菜单项点击事件，查看详情
async function handleMealClick(e) {
  const mealEl = e.target.closest(".meal");
  if (!mealEl) return;

  const mealId = mealEl.getAttribute("data-meal-id");

  try {
    // 从API获取详情数据
    const response = await fetch(`${LOOKUP_URL}${mealId}`);
    const data = await response.json();

    if (data.meals && data.meals[0]) {
      const meal = data.meals[0];

      // 提取食材列表
      const ingredients = [];

      for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
          ingredients.push({
            ingredient: meal[`strIngredient${i}`],
            measure: meal[`strMeasure${i}`] || "",
          });
        }
      }

      // 显示菜单详情
      mealDetailsContent.innerHTML = `
           <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
           <h2 class="meal-details-title">${meal.strMeal}</h2>
           <div class="meal-details-category">
             <span>${meal.strCategory || "未分类"}</span>
           </div>
           <div class="meal-details-instructions">
             <h3>烹饪步骤</h3>
             <p>${meal.strInstructions || "暂无烹饪步骤"}</p>
           </div>
           <div class="meal-details-ingredients">
             <h3>食材</h3>
             <ul class="ingredients-list">
               ${ingredients
                 .map(
                   (item) => `
                 <li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>
               `
                 )
                 .join("")}
             </ul>
           </div>
           ${
             meal.strYoutube
               ? `
             <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
               <i class="fab fa-youtube"></i> 观看视频
             </a>
           `
               : ""
           }
         `;
      mealDetails.classList.remove("hidden");
      mealDetails.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("加载详情错误:", error);
    errorContainer.textContent = "无法加载菜谱详情，请稍后再试。";
    errorContainer.classList.remove("hidden");
  }
}

// 页面加载时，尝试从本地存储恢复上次的搜索结果
window.addEventListener('DOMContentLoaded', () => {
  try {
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
      const searchData = JSON.parse(lastSearch);
      // 如果是最近30分钟内的搜索，恢复显示
      const searchTime = new Date(searchData.timestamp);
      const now = new Date();
      const timeDiff = now - searchTime;
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 30) {
        resultHeading.textContent = `上次搜索 "${searchData.term}" 的结果：`;
        displayMeals(searchData.results);
      }
    }
  } catch (error) {
    console.error("加载本地存储数据错误:", error);
  }
});