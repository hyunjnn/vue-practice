<template>
  <div id="app" class="container mt-5">
    <h1 class="mb-4 text-center">인기 상품</h1>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-secondary" @click="prevPage" :disabled="currentPage === 1 || loading">이전 페이지</button>
      <span class="fs-5"> 페이지: {{ currentPage }} / {{ totalPages > 0 ? totalPages : '?' }} </span>
      <button
        class="btn btn-secondary"
        @click="nextPage"
        :disabled="currentPage === totalPages || loading || products.length === 0"
      >
        다음 페이지
      </button>
    </div>

    <div v-if="loading" class="text-center mt-3">데이터를 불러오는 중...</div>
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

    <div v-if="products.length > 0" class="mt-4">
      <h3 class="mb-3">인기 상품 목록 (총 {{ totalItems }}개)</h3>
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>행번호</th>
            <th>판매년도</th>
            <th>판매월</th>
            <th>선정기준</th>
            <th>상품명</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, index) in products" :key="product.rowno || index">
            <td>{{ product.rowno }}</td>
            <td>{{ product.sellyear }}</td>
            <td>{{ product.sellmonth }}</td>
            <td>{{ product.seltnstd }}</td>
            <td>{{ product.prdtnm }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="!loading && !error" class="alert alert-info mt-3">데이터가 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { calculatePageIndices } from './utils/pagination';

const apiKey = import.meta.env.VITE_MND_PX_API_KEY;
const serviceType = 'json';
const serviceName = 'DS_MND_PX_PARD_PRDT_INFO';

const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);

const products = ref([]);
const loading = ref(false);
const error = ref(null);

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  products.value = [];

  const { startIndex, endIndex } = calculatePageIndices(currentPage.value, itemsPerPage.value);

  const url = `/api/${apiKey}/${serviceType}/${serviceName}/${startIndex}/${endIndex}/`;

  try {
    const response = await axios.get(url);
    console.log('API 응답:', response.data);

    let apiResponseData = response.data;
    let productsArray = [];

    let serviceContainer = apiResponseData[serviceName];

    if (serviceContainer) {
      totalItems.value = serviceContainer.list_total_count || 0;

      if (serviceContainer && Array.isArray(serviceContainer.row)) {
        productsArray = serviceContainer.row;
      } else if (serviceContainer && serviceContainer.CODE) {
        error.value = `API 오류: ${serviceContainer.MESSAGE} (코드: ${serviceContainer.CODE})`;
      } else if (serviceContainer && serviceContainer.list_total_count === 0) {
        products.value = [];
        totalItems.value = 0;
        return;
      } else {
        error.value = 'API 응답 형식이 예상과 다릅니다. 콘솔을 다시 확인해주세요.';
      }
    } else {
      error.value = 'API 응답에 예상되는 서비스 데이터가 없습니다.';
    }

    products.value = productsArray;
  } catch (err) {
    console.error('API 요청 중 오류 발생:', err);
    error.value = '데이터를 불러오는데 실패했습니다. 네트워크 연결 또는 API 키를 확인해주세요.';
    if (axios.isAxiosError(err) && err.response) {
      error.value += ` (상태 코드: ${err.response.status})`;
      if (err.response.data) {
        console.log('API Error Response Data:', err.response.data);
      }
    } else if (axios.isAxiosError(err) && err.request) {
      error.value += ` (네트워크 오류 또는 프록시 설정 문제: ${err.message})`;
    } else {
      error.value += ` (알 수 없는 오류: ${err.message})`;
    }
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchProducts();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchProducts();
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
table th,
table td {
  vertical-align: middle;
  font-size: 0.95rem;
}
.input-group-text {
  background-color: #e9ecef;
}
</style>
