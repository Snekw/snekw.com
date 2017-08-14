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
    get: {
      path: 'user.hbs'
    },
    manage: {
      path: 'manageUser.hbs'
    }
  },
  error: {
    get: {
      path: 'error.hbs'
    }
  },
  error404: {
    get: {
      path: 'error404.hbs'
    }
  },
  project: {
    get: {
      path: 'project/project.hbs'
    },
    new: {
      path: 'project/newProject.hbs'
    },
    edit: {
      path: 'project/editProject.hbs'
    }
  },
  about: {
    get: {
      path: 'about/about.hbs'
    },
    new: {
      path: 'about/newAbout.hbs'
    },
    edit: {
      path: 'about/editAbout.hbs'
    }
  },
  archive: {
    get: {
      path: 'archive.hbs'
    }
  }
};
