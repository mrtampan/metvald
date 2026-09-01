<template>
  <nav class="bg-white shadow-lg">
    <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <div class="flex-shrink-0">
          <a href="/" class="text-2xl font-bold text-blue-600"> Metvald </a>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex space-x-8">
          <RouterLink
            to="/"
            class="text-gray-700 hover:text-blue-600 transition duration-300 font-medium"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/token-list"
            class="text-gray-700 hover:text-blue-600 transition duration-300 font-medium"
          >
            Token List
          </RouterLink>

          <RouterLink
            to="/dexscreener-list"
            class="text-gray-700 hover:text-blue-600 transition duration-300 font-medium flex items-center gap-1.5"
          >
            <span
              class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            ></span>
            Dexscreener List
          </RouterLink>
        </div>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button
            @click="isOpen = !isOpen"
            class="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
          >
            <svg
              v-if="!isOpen"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="isOpen" class="md:hidden pb-4 border-t border-gray-200">
        <RouterLink
          to="/"
          class="block px-2 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition duration-300"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/token-list"
          class="block px-2 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition duration-300"
        >
          Token List
        </RouterLink>
        <RouterLink
          to="/dexscreener-list"
          class="block px-2 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition duration-300"
        >
          Dexscreener List
        </RouterLink>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";

const isOpen = ref(false);
</script>

<style scoped>
/* Smooth transitions for menu toggle */
svg {
  transition: transform 0.3s ease-in-out;
}
</style>
