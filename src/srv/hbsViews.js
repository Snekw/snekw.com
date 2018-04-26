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

module.exports = {
  index: {
    get: {
      path: 'index.hbs'
    }
  },
  user: {
    meta: {
      robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
    },
    get: {
      path: 'user.hbs'
    },
    manage: {
      path: 'manageUser.hbs'
    }
  },
  error: {
    get: {
      path: 'error.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    }
  },
  error404: {
    get: {
      path: 'error404.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    }
  },
  article: {
    base: 'article/',
    get: {
      path: 'article.hbs'
    },
    new: {
      path: 'edit.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    },
    edit: {
      path: 'edit.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    },
    delete: {
      path: 'delete.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    }
  },
  about: {
    base: 'about/',
    get: {
      path: 'about.hbs'
    },
    new: {
      path: 'edit.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    },
    edit: {
      path: 'edit.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    },
    delete: {
      path: 'delete.hbs',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      }
    }
  },
  archive: {
    get: {
      path: 'archive.hbs'
    }
  },
  admin: {
    base: 'admin/',
    meta: {
      robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
    },
    dashboard: {
      path: 'dashboard.hbs',
      icon: 'dashboard',
      name: 'Dashboard'
    },
    statistics: {
      path: 'statistics.hbs',
      icon: 'poll',
      name: 'Statistics'
    },
    managearticles: {
      path: 'manageArticles.hbs',
      icon: 'list',
      name: 'Manage articles'
    }
  }
};
