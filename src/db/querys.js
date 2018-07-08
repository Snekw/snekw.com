/**
 *  snekw.com,
 *  Copyright (C) 2017 Ilkka Kuosmanen
 *
 *  This file is part of snekw.com.
 *
 *  snekw.com is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  snekw.com is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with snekw.com.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';
const models = require('./models.js');

const indexArticlesQuery = models.article.find({public: 1})
  .select('author brief title indexImagePath updatedAt postedAt public')
  .sort('-postedAt')
  .limit(10)
  .lean();

const aboutGetQuery = models.about.findOne({active: true})
  .lean()
  .select('body postedAt');

const getLatestArticles = models.article.find({public: 1})
  .select('author brief body title indexImagePath updatedAt postedAt public')
  .sort('-postedAt')
  .limit(10)
  .lean();

const getArticleCount = models.article.count({public: 1});

module.exports = {
  indexArticlesQuery,
  aboutGetQuery,
  getLatestArticles,
  getArticleCount
};
