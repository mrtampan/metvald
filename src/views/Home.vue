<template>
  <div class="bg-gray-100 min-h-screen p-8">
    <div class="max-w-6xl mx-auto space-y-8">
      <section
        class="bg-white rounded-2xl shadow-md border border-gray-200 p-8 md:p-12"
      >
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span
              class="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4"
            >
              Metvald Screening
            </span>
            <h1
              class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight"
            >
              Screen token dengan cepat dan aman.
            </h1>
            <p class="mt-4 text-lg text-gray-600">
              Cek risiko token, analisis metadata, dan lihat insight pasar hanya
              dengan satu alamat token.
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
              <RouterLink
                to="/list-token"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition duration-300"
              >
                List Token
              </RouterLink>
              <RouterLink
                to="/check-token"
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-3 rounded-xl transition duration-300"
              >
                Check Token
              </RouterLink>
            </div>
          </div>

          <div
            class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-100"
          >
            <div class="grid gap-4">
              <div
                class="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <p class="text-sm text-gray-500">Token Scan</p>
                <p class="text-2xl font-bold text-gray-900">98%</p>
                <p class="text-xs text-green-600 mt-1">Healthy signal</p>
              </div>

              <div
                class="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <p class="text-sm text-gray-500">Risk Status</p>
                <p class="text-2xl font-bold text-red-500">Low</p>
                <p class="text-xs text-gray-500 mt-1">Based on live metrics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid md:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Risk Score</h3>
            <span
              class="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              Safe
            </span>
          </div>
          <p class="text-sm text-gray-600">
            Evaluasi score token berdasarkan data analitik dan potensi risiko
            pada kontrak.
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Market Data</h3>
            <span
              class="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              Live
            </span>
          </div>
          <p class="text-sm text-gray-600">
            Menampilkan informasi pasar seperti cap, liquidity, dan volume
            trading dari data ekternal.
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Token Info</h3>
            <span
              class="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              Details
            </span>
          </div>
          <p class="text-sm text-gray-600">
            Informasi token seperti nama, simbol, serta detail keamanan dan
            authority yang relevan.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
