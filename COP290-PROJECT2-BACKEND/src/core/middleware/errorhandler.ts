// Centralized system for error handling.
export const handleError = (res, err) => {
  switch (err?.message) {
    case 'ERROR_1':
      return res.status(404).json({ error: 'Project not found' });
    case 'ERROR_2':
      return res.status(403).json({ error: 'Not authorized to view boards' });
    case 'ERROR_3':
      return res.status(404).json({ error: 'Project not found' });
    case 'ERROR_4':
      return res.status(403).json({ error: 'Only admins can create boards' });
    case 'ERROR_5':
      return res.status(404).json({ error: 'Board not found' });
    case 'ERROR_6':
      return res.status(404).json({ error: 'Board not found' });
    case 'ERROR_7':
      return res.status(403).json({ error: 'Only admins can update boards' });
    case 'ERROR_8':
      return res.status(404).json({ error: 'Board not found' });
    case 'ERROR_9':
      return res.status(403).json({ error: 'Only admins can add columns' });
    case 'ERROR_10':
      return res.status(404).json({ error: 'Board not found' });
    case 'ERROR_11':
      return res.status(403).json({ error: 'Only admins can delete boards' });
    case 'ERROR_12':
      return res.status(400).json({ error: 'Email already exists' });
    case 'ERROR_13':
      return res.status(400).json({ error: 'Username already exists' });
    case 'ERROR_14':
      return res.status(401).json({ error: 'Invalid credentials' });
    case 'ERROR_15':
      return res.status(404).json({ error: 'User not found' });
    case 'ERROR_16':
      return res.status(400).json({ error: 'No fields to update' });
    case 'ERROR_17':
      return res.status(404).json({ error: 'Column not found' });
    case 'ERROR_18':
      return res.status(403).json({ error: 'Only admins can update columns' });
    case 'ERROR_19':
      return res.status(404).json({ error: 'Column not found' });
    case 'ERROR_20':
      return res.status(404).json({ error: 'Column not found' });
    case 'ERROR_21':
      return res.status(403).json({ error: 'Not authorized to create issues' });
    case 'ERROR_22':
      return res.status(404).json({ error: 'Comment not found' });
    case 'ERROR_23':
      return res.status(404).json({ error: 'Column not found' });
    case 'ERROR_24':
      return res.status(403).json({ error: 'Not authorized to edit comments' });
    case 'ERROR_25':
      return res
        .status(403)
        .json({ error: 'Only the author can edit this comment' });
    case 'ERROR_26':
      return res.status(404).json({ error: 'Comment not found' });
    case 'ERROR_27':
      return res.status(404).json({ error: 'Column not found' });
    case 'ERROR_28':
      return res
        .status(403)
        .json({ error: 'Not authorized to delete comments' });
    case 'ERROR_29':
      return res
        .status(403)
        .json({ error: 'Only the author can delete this comment' });
    case 'ERROR_30':
      return res.status(404).json({ error: 'Issue not found' });
    case 'ERROR_31':
      return res.status(404).json({ error: 'Issue not found' });
    case 'ERROR_32':
      return res.status(403).json({ error: 'Not authorized to update issue' });
    case 'ERROR_33':
      return res.status(404).json({ error: 'Issue not found' });
    case 'ERROR_34':
      return res.status(403).json({ error: 'Not authorized to move issue' });
    case 'ERROR_35':
      return res
        .status(400)
        .json({ error: 'Stories cannot be moved directly' });
    case 'ERROR_36':
      return res.status(404).json({ error: 'Destination column not found' });
    case 'ERROR_37':
      return res.status(400).json({ error: 'Invalid status transition' });
    case 'ERROR_38':
      return res
        .status(400)
        .json({ error: 'Destination column limit reached' });
    case 'ERROR_39':
      return res.status(404).json({ error: 'Issue not found' });
    case 'ERROR_40':
      return res.status(404).json({ error: 'Project not found' });
    case 'ERROR_41':
      return res.status(403).json({ error: 'Not authorized to delete issue' });
    case 'ERROR_42':
      return res.status(404).json({ error: 'Issue not found' });
    case 'ERROR_43':
      return res
        .status(403)
        .json({ error: 'Not authorized to comment on this issue' });
    case 'ERROR_44':
      return res
        .status(403)
        .json({ error: 'Not authorized to view this project' });
    case 'ERROR_45':
      return res.status(404).json({ error: 'Project not found' });
    case 'ERROR_46':
      return res.status(403).json({ error: 'Not authorized to view boards' });
    case 'ERROR_47':
      return res.status(403).json({ error: 'Only admins can update projects' });
    case 'ERROR_48':
      return res
        .status(403)
        .json({ error: 'Only admins can archive projects' });
    case 'ERROR_49':
      return res.status(404).json({ error: 'User not found' });
    case 'ERROR_50':
      return res.status(403).json({ error: 'Only admins can add members' });
    case 'ERROR_51':
      return res
        .status(400)
        .json({ error: 'User is already a member of this project' });
    case 'ERROR_52':
      return res
        .status(403)
        .json({ error: 'Only admins can update member roles' });
    case 'ERROR_53':
      return res
        .status(404)
        .json({ error: 'User is not a member of this project' });
    case 'ERROR_54':
      return res.status(403).json({ error: 'Only admins can remove members' });
    case 'ERROR_55':
      return res
        .status(404)
        .json({ error: 'User does not exist in this project' });
    case 'ERROR_56':
      return res.status(404).json({ error: 'User not found' });
    case 'ERROR_57':
      return res.status(400).json({ error: 'Avatar is required' });
    case 'ERROR_58':
      return res.status(403).json({ error: 'Only admins can delete columns' });
    case 'ERROR_59':
      return res.status(400).json({ error: 'Project name is required' });
    case 'ERROR_60':
      return res
        .status(404)
        .json({ error: 'Cannot Remove oneself from the project' });
    case 'ERROR_61':
      return res
        .status(403)
        .json({ error: 'Assignee must be a member of the project' });
    case 'ERROR_62':
      return res
        .status(400)
        .json({ error: 'Default column cannot be deleted' });
    case 'ERROR_63':
      return res
        .status(400)
        .json({ error: 'Matching default column not found' });
    case 'ERROR_64':
      return res
        .status(400)
        .json({ error: 'Tasks and bugs can only move in task/bug columns' });
    case 'ERROR_65':
      return res
        .status(400)
        .json({ error: 'Default column cannot be updated' });
    case 'ERROR_66':
      return res.status(400).json({
        error:
          'Workflow must be an array of blocked source-target pairs with valid column ids',
      });
    case 'ERROR_67':
      return res.status(400).json({
        error: 'Workflow contains column ids that do not belong to the board',
      });
    case 'ERROR_68':
      return res
        .status(400)
        .json({ error: 'Column with that name already exists in the board' });
    case 'ERROR_69':
      return res
        .status(403)
        .json({ error: 'Only global admins can create projects' });
    case 'ERROR_70':
      return res
        .status(403)
        .json({ error: 'Only global admins can manage users' });
    case 'ERROR_71':
      return res
        .status(400)
        .json({ error: 'At least one global admin must remain' });
    case 'ERROR_72':
      return res.status(400).json({
        error: 'Parent issue must be a story from the same board and project',
      });
    case 'ERROR_73':
      return res.status(400).json({
        error: 'Parent comment must exist and belong to the same issue',
      });
    case 'ERROR_74':
      return res.status(400).json({
        error: 'WIP Limit Exceeded.',
      });
    default:
      return res.status(500).json({ error: 'Internal server error' });
  }
};
