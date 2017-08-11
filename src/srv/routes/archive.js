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
const router = require('express').Router();
const HbsViews = require('../HbsViews');
const models = require('../../db/models.js');
const normalizeError = require('../Error').normalizeError;
const auth0Api = require('../../lib/auth0Api');

const defaultPage = 0;
const defaultCount = 10;

function getArchive (req, res, next) {
  if (!req.params.page) {
    req.params.page = defaultPage;
  } else {
    req.params.page = parseInt(req.params.page);
  }
  if (!req.params.count) {
    req.params.count = defaultCount;
  } else {
    req.params.count = parseInt(req.params.count);
  }
  // Pagination
  models.project.count((err, count) => {
    if (err) {
      console.error(err);
    }
    // Determine needed page numbers
    let page = req.params.page;
    let dcount = req.params.count;
    let pages = [page - 2, page - 1, page, page + 1, page + 2];
    let actualPages = [];
    for (let i = 0; i < pages.length; i++) {
      // If the page is larger than -1 and the count of
      // items is not larger than display count for that page
      if (pages[i] > -1 && pages[i] * dcount <= count) {
        actualPages.push(pages[i]);
      }
    }
    req.context.pagination = [];
    // Determine if we need the 'First' or 'Previous' buttons
    if (actualPages[0] !== page) {
      req.context.pagination = [
        {
          page: 'First',
          href: '0-' + dcount.toString()
        }, {
          page: 'Previous',
          href: (page - 1).toString() + '-' + dcount.toString()
        }];
    }
    for (let i = 0; i < actualPages.length; i++) {
      let href = actualPages[i].toString() + '-' + dcount.toString();
      let active = false;
      if (page === actualPages[i]) {
        active = true;
      }
      req.context.pagination.push({page: actualPages[i], href: href, active: active});
    }

    // Determine if we need the 'Next' or 'Last' buttons
    if (actualPages[actualPages.length - 1] !== page) {
      let temp = [
        {
          page: 'Next',
          href: (page + 1).toString() + '-' + dcount.toString()
        }, {
          page: 'Last',
          href: Math.trunc(count / dcount).toString() + '-' + dcount.toString()
        }];
      req.context.pagination = req.context.pagination.concat(temp);
    }
  });

  models.project.find()
    .skip(req.params.page * req.params.count)
    .limit(req.params.count)
    .sort('-postedAt')
    .lean()
    .select('postedAt updatedAt author brief title indexImageUrl')
    .exec(
      (err, data) => {
        if (err) {
          req.context.error = normalizeError(new Error('Db query failed'));
          return res.send(HbsViews.views.error(req.context));
        }
        if (data) {
          req.context.projects = data;
          let querys = [];

          let uniques = [];
          for (let i = 0; i < req.context.projects.length; i++) {
            if (uniques.indexOf(req.context.projects[i].author) === -1) {
              uniques.push(req.context.projects[i].author);
            }
          }

          for (let i = 0; i < uniques.length; i++) {
            const opts = {
              method: 'GET',
              url: 'users',
              qs: {
                q: 'user_id:"' + uniques[i] + '"'
              }
            };
            querys.push(auth0Api.queryApiPromise(opts));
          }

          Promise.all(querys).then(data => {
            for (let i = 0; i < req.context.projects.length; i++) {
              for (let d = 0; d < data.length; d++) {
                if (data[d].length < 1) {
                  break;
                }
                if (req.context.projects[i].author === data[d][0].user_id) {
                  req.context.projects[i].author = data[d][0];
                }
              }
            }
            res.send(HbsViews.views.archive(req.context));
          }).catch(err => {
            return next(err);
          });
        }
      }
    );
}

router.get('/', getArchive);

router.get('/:page-:count', getArchive);

module.exports = router;
