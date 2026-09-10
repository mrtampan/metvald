<template>
  <nav class="bg-white shadow-lg">
    <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <div class="flex-shrink-0">
          <a href="/" class="text-2xl font-bold text-blue-600"> Metvald </a>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-8">
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

          <!-- About Submenu Dropdown -->
          <div ref="aboutDropdownRef" class="relative">
            <button
              @click="isAboutOpen = !isAboutOpen"
              class="text-gray-700 hover:text-blue-600 transition duration-300 font-medium flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <span>About</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': isAboutOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div
                v-if="isAboutOpen"
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 focus:outline-none"
              >
                <a
                  href="https://x.com/achmadrivaldi16"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="isAboutOpen = false"
                  class="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-150"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 flex items-center justify-center text-gray-700 group-hover/item:text-blue-600 transition duration-150"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                      />
                    </svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium">X (Twitter)</span>
                    <span class="text-xs text-gray-400">@achmadrivaldi16</span>
                  </div>
                  <svg
                    class="w-3.5 h-3.5 ml-auto text-gray-400 group-hover/item:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>

                <a
                  href="https://github.com/mrtampan/metvald"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="isAboutOpen = false"
                  class="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-150"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 flex items-center justify-center text-gray-700 group-hover/item:text-blue-600 transition duration-150"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium">GitHub</span>
                    <span class="text-xs text-gray-400">mrtampan/metvald</span>
                  </div>
                  <svg
                    class="w-3.5 h-3.5 ml-auto text-gray-400 group-hover/item:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </transition>
          </div>
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

        <!-- Mobile About Section -->
        <div class="pt-2 mt-2 border-t border-gray-100">
          <div class="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            About
          </div>
          <a
            href="https://x.com/achmadrivaldi16"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition duration-300"
          >
            <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            <span>X (@achmadrivaldi16)</span>
          </a>
          <a
            href="https://github.com/mrtampan/metvald"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition duration-300"
          >
            <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub (mrtampan/metvald)</span>
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";

const isOpen = ref(false);
const isAboutOpen = ref(false);
const aboutDropdownRef = ref(null);

onClickOutside(aboutDropdownRef, () => {
  isAboutOpen.value = false;
});
</script>

<style scoped>
/* Smooth transitions for menu toggle */
svg {
  transition: transform 0.3s ease-in-out;
}
</style>
