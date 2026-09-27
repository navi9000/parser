<template>
  <div class="pa-2 d-flex ga-2 flex-column">
    <company-search />
    <company-info />
    <comment-list />
  </div>
</template>

<script setup lang="ts">
import CompanySearch from "./company-search.vue"
import CompanyInfo from "./company-info.vue"
import commentList from "./comment-list.vue"
</script>
