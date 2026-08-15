<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const tokenAddress = ref("");
const errorMessage = ref("");

const handleSubmit = () => {
  const token = tokenAddress.value.trim();

  if (!token) {
    errorMessage.value = "Please enter a Token address";
    return;
  }

  errorMessage.value = "";

  router.push({
    name: "screening",
    query: { token },
  });
};
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-8">
    <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Check Token</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label
            for="tokenAddress"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Token Address
          </label>
          <input
            id="tokenAddress"
            v-model="tokenAddress"
            type="text"
            placeholder="Enter your token address"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
          />
        </div>

        <p v-if="errorMessage" class="text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
        >
          Submit
        </button>
      </form>
    </div>
  </div>
</template>
